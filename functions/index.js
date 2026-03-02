const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

admin.initializeApp();
const db = admin.firestore();
const analyticsClient = new BetaAnalyticsDataClient();

const adminEmails = new Set([
  'bearfastofficial@gmail.com',
  'bearfast313@gmail.com'
]);

const isAdmin = async (uid, email) => {
  if (email && adminEmails.has(String(email).toLowerCase())) {
    return true;
  }
  const adminUsersDoc = await db.doc(`adminUsers/${uid}`).get();
  if (adminUsersDoc.exists && adminUsersDoc.data()?.enabled === true) {
    return true;
  }
  const adminsDoc = await db.doc(`admins/${uid}`).get();
  if (adminsDoc.exists && adminsDoc.data()?.role === 'admin') {
    return true;
  }
  return false;
};

exports.getAnalytics = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const authHeader = req.headers.authorization || '';
      if (!authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing auth token' });
        return;
      }
      const token = authHeader.replace('Bearer ', '');
      const decoded = await admin.auth().verifyIdToken(token);
      const ok = await isAdmin(decoded.uid, decoded.email);
      if (!ok) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const propertyId = functions.config().analytics?.property_id;
      if (!propertyId) {
        res.status(500).json({ error: 'Analytics property ID missing' });
        return;
      }

      const property = `properties/${propertyId}`;
      const dateRanges = [{ startDate: 'today', endDate: 'today' }];

      const [summary] = await analyticsClient.runReport({
        property,
        dateRanges,
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' }
        ]
      });

      const [countries] = await analyticsClient.runReport({
        property,
        dateRanges,
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [
          { metric: { metricName: 'activeUsers' }, desc: true }
        ],
        limit: 6
      });

      const [pages] = await analyticsClient.runReport({
        property,
        dateRanges,
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [
          { metric: { metricName: 'screenPageViews' }, desc: true }
        ],
        limit: 6
      });

      const usersToday = Number(summary.rows?.[0]?.metricValues?.[0]?.value || 0);
      const sessionsToday = Number(summary.rows?.[0]?.metricValues?.[1]?.value || 0);
      const pageViewsToday = Number(summary.rows?.[0]?.metricValues?.[2]?.value || 0);

      const topCountries = (countries.rows || []).map((row) => ({
        name: row.dimensionValues?.[0]?.value || 'Unknown',
        users: Number(row.metricValues?.[0]?.value || 0)
      }));

      const topPages = (pages.rows || []).map((row) => ({
        path: row.dimensionValues?.[0]?.value || '/',
        views: Number(row.metricValues?.[0]?.value || 0)
      }));

      res.json({
        usersToday,
        sessionsToday,
        pageViewsToday,
        topCountries,
        topPages,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Analytics] fetch failed', error);
      res.status(500).json({ error: 'Analytics fetch failed' });
    }
  });
});
