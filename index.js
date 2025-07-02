
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('attached_assets'));

// Firebase Admin initialization
const serviceAccount = {
  "type": "service_account",
  "project_id": "smart-lottery-b08c5",
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
};

// Initialize Firebase Admin only if credentials are available
let db = null;
try {
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
    });
    db = admin.firestore();
    console.log('✅ Firebase Admin initialized successfully');
  } else {
    console.log('⚠️ Firebase credentials not found, running in development mode');
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
}

// Contest templates with reduced time (1 day less)
const CONTEST_TEMPLATES = [
  {
    id: 'ultimate_crorepati',
    title: 'Ultimate Crorepati',
    entryFee: 1000,
    maxParticipants: 10000,
    prizePool: 10000000,
    cycleDuration: 8 * 24 * 60 * 60 * 1000, // Reduced from 9 to 8 days
    drawTime: '18:00',
    description: 'The ultimate lottery experience! Win up to ₹1 CRORE',
    prizeStructure: [
      { position: '1st Prize', amount: 5000000, percentage: '50%' },
      { position: '2nd Prize', amount: 2500000, percentage: '25%' },
      { position: '3rd Prize', amount: 1000000, percentage: '10%' },
      { position: '4th Prize (Compensation * 625)', amount: 2000, percentage: 'For Real Winners' }
    ],
    compensationPrizes: {
      total: 625,
      amount: 2000,
      realWinners: 3
    }
  },
  {
    id: 'Easy_jackpot',
    title: 'Mega Jackpot',
    entryFee: 50,
    maxParticipants: 2000,
    prizePool: 100000,
    cycleDuration: 12 * 60 * 60 * 1000, // Reduced from 1 day to 12 hours
    drawTime: '18:00',
    description: 'Our flagship daily lottery with life-changing prizes',
    prizeStructure: [
      { position: '1st Prize', amount: 50000, percentage: '50%' },
      { position: '2nd Prize', amount: 25000, percentage: '25%' },
      { position: '3rd Prize', amount: 10000, percentage: '10%' },
      { position: '4th Prize (Compensation * 100)', amount: 100, percentage: 'For Real Winners' }
    ],
    compensationPrizes: {
      total: 100,
      amount: 100,
      realWinners: 3
    }
  },
  {
    id: 'golden_draw',
    title: 'Golden Fortune',
    entryFee: 100,
    maxParticipants: 1500,
    prizePool: 150000,
    cycleDuration: 1 * 24 * 60 * 60 * 1000, // Reduced from 2 to 1 day
    drawTime: '18:00',
    description: 'Premium lottery with multiple prize tiers',
    prizeStructure: [
      { position: '1st Prize', amount: 75000, percentage: '50%' },
      { position: '2nd Prize', amount: 37500, percentage: '25%' },
      { position: '3rd Prize', amount: 15000, percentage: '10%' },
      { position: '4th Prize (Compensation * 100)', amount: 200, percentage: 'For Real Winners' }
    ],
    compensationPrizes: {
      total: 100,
      amount: 200,
      realWinners: 3
    }
  },
  {
    id: 'speed_Earning',
    title: 'Speed Earning',
    entryFee: 25,
    maxParticipants: 800,
    prizePool: 20000,
    cycleDuration: 6 * 60 * 60 * 1000, // Reduced from 12 to 6 hours
    drawTime: ['06:00', '18:00'],
    description: 'Quick-fire lottery with instant results',
    prizeStructure: [
      { position: '1st Prize', amount: 10000, percentage: '50%' },
      { position: '2nd Prize', amount: 5000, percentage: '25%' },
      { position: '3rd Prize', amount: 2000, percentage: '10%' },
      { position: '4th Prize (Compensation * 30)', amount: 100, percentage: 'For Real Winners' }
    ],
    compensationPrizes: {
      total: 30,
      amount: 100,
      realWinners: 3
    }
  },
  {
    id: 'festival_special',
    title: 'Festival Special',
    entryFee: 200,
    maxParticipants: 1200,
    prizePool: 240000,
    cycleDuration: 2 * 24 * 60 * 60 * 1000, // Reduced from 3 to 2 days
    drawTime: '18:00',
    description: 'Festival special with bumper prizes',
    prizeStructure: [
      { position: '1st Prize', amount: 120000, percentage: '50%' },
      { position: '2nd Prize', amount: 60000, percentage: '25%' },
      { position: '3rd Prize', amount: 24000, percentage: '10%' },
      { position: '4th Prize (Compensation * 80)', amount: 400, percentage: 'For Real Winners' }
    ],
    compensationPrizes: {
      total: 80,
      amount: 400,
      realWinners: 3
    }
  },
  {
    id: 'crorepati_dream',
    title: 'Crorepati Dream',
    entryFee: 500,
    maxParticipants: 1000,
    prizePool: 500000,
    cycleDuration: 3 * 24 * 60 * 60 * 1000, // Reduced from 4 to 3 days
    drawTime: '18:00',
    description: 'The ultimate dream lottery',
    prizeStructure: [
      { position: '1st Prize', amount: 250000, percentage: '50%' },
      { position: '2nd Prize', amount: 125000, percentage: '25%' },
      { position: '3rd Prize', amount: 50000, percentage: '10%' },
      { position: '4th Prize (Compensation * 70)', amount: 1000, percentage: 'For Real Winners' }
    ],
    compensationPrizes: {
      total: 70,
      amount: 1000,
      realWinners: 3
    }
  }
];

// Automated profile update system
class ProfileAutomationService {
  constructor() {
    this.isRunning = false;
    this.updateInterval = null;
  }

  start() {
    if (this.isRunning || !db) {
      console.log('Profile automation already running or Firebase not available');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting automated profile update service...');

    // Run every 30 seconds to ensure real-time updates
    this.updateInterval = setInterval(() => {
      this.processProfileUpdates();
    }, 30000);

    // Initial run
    this.processProfileUpdates();
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ Profile automation service stopped');
  }

  async processProfileUpdates() {
    try {
      console.log('🔄 Processing automated profile updates...');

      // Get all users who need profile updates
      const usersSnapshot = await db.collection('users')
        .where('forceRefresh', '==', true)
        .limit(50)
        .get();

      if (usersSnapshot.empty) {
        return;
      }

      const batch = db.batch();
      let updateCount = 0;

      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        const userRef = db.collection('users').doc(doc.id);

        // Calculate updated profile stats
        const joinedContests = userData.joinedContests || [];
        const contestsJoined = joinedContests.length;
        const contestsWon = joinedContests.filter(jc => jc.status === 'won').length;
        const totalWinnings = joinedContests
          .filter(jc => jc.prizeWon > 0)
          .reduce((sum, jc) => sum + (jc.prizeWon || 0), 0);

        // Update profile with calculated stats
        batch.update(userRef, {
          contestsJoined: contestsJoined,
          contestsWon: contestsWon,
          totalWinnings: totalWinnings,
          winRate: contestsJoined > 0 ? Math.round((contestsWon / contestsJoined) * 100) : 0,
          lastProfileUpdate: admin.firestore.FieldValue.serverTimestamp(),
          forceRefresh: admin.firestore.FieldValue.delete(),
          profileAutomated: true
        });

        updateCount++;
      });

      if (updateCount > 0) {
        await batch.commit();
        console.log(`✅ Automated ${updateCount} profile updates`);
      }

    } catch (error) {
      console.error('❌ Error in automated profile updates:', error);
    }
  }
}

// Contest management system
class ContestManager {
  constructor() {
    this.activeContests = [];
    this.lifecycleInterval = null;
  }

  async initialize() {
    try {
      if (!db) {
        console.log('⚠️ Database not available, using local contests');
        this.createLocalContests();
        return;
      }

      console.log('🔄 Initializing contest management...');
      await this.loadOrCreateContests();
      this.startLifecycleManager();
      
    } catch (error) {
      console.error('❌ Error initializing contests:', error);
      this.createLocalContests();
    }
  }

  createLocalContests() {
    this.activeContests = CONTEST_TEMPLATES.map(template => ({
      ...template,
      currentParticipants: Math.floor(Math.random() * 20) + 5,
      endTime: this.calculateNextDrawTime(template),
      status: 'active',
      participants: [],
      createdAt: new Date(),
      isActive: true,
      cycleNumber: 1,
      title: `${template.title} - Cycle 1`
    }));
    console.log('✅ Created local contests with reduced timing');
  }

  async loadOrCreateContests() {
    const contestsSnapshot = await db.collection('contests').get();
    
    if (!contestsSnapshot.empty) {
      const existingContests = contestsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          endTime: data.endTime.toDate ? data.endTime.toDate() : new Date(data.endTime),
          createdAt: data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        };
      });
      
      // Update existing contests with new reduced timing
      const updatedContests = [];
      const batch = db.batch();
      
      for (const contest of existingContests) {
        const template = CONTEST_TEMPLATES.find(t => t.id === contest.id);
        if (!template) continue;
        
        const newEndTime = this.calculateNextDrawTime(template);
        const cycleNumber = (contest.cycleNumber || 0) + 1;
        
        const updatedContest = {
          ...template,
          currentParticipants: Math.floor(Math.random() * 20) + 5,
          endTime: newEndTime,
          status: 'active',
          participants: [],
          createdAt: new Date(),
          isActive: true,
          cycleNumber: cycleNumber,
          title: `${template.title} - Cycle ${cycleNumber}`,
          lastRestart: new Date(),
          timingUpdated: true
        };
        
        updatedContests.push(updatedContest);
        
        const contestRef = db.collection('contests').doc(contest.id);
        batch.set(contestRef, updatedContest);
      }
      
      if (updatedContests.length > 0) {
        await batch.commit();
        console.log('✅ Updated contests with reduced timing');
      }
      
      this.activeContests = updatedContests;
    } else {
      // Create fresh contests
      const contests = CONTEST_TEMPLATES.map(template => {
        const endTime = this.calculateNextDrawTime(template);
        const cycleNumber = 1;
        
        return {
          ...template,
          currentParticipants: Math.floor(Math.random() * 20) + 5,
          endTime: endTime,
          status: 'active',
          participants: [],
          createdAt: new Date(),
          isActive: true,
          cycleNumber: cycleNumber,
          title: `${template.title} - Cycle ${cycleNumber}`
        };
      });

      const batch = db.batch();
      contests.forEach(contest => {
        const contestRef = db.collection('contests').doc(contest.id);
        batch.set(contestRef, contest);
      });
      await batch.commit();

      this.activeContests = contests;
      console.log('✅ Created new contests with reduced timing');
    }
  }

  calculateNextDrawTime(template) {
    const now = new Date();
    const drawTimes = Array.isArray(template.drawTime) ? template.drawTime : [template.drawTime];
    
    // For Speed Earning (6-hour cycle)
    if (template.id === 'speed_Earning') {
      const next6AM = new Date(now);
      next6AM.setHours(6, 0, 0, 0);
      const next12PM = new Date(now);
      next12PM.setHours(12, 0, 0, 0);
      const next6PM = new Date(now);
      next6PM.setHours(18, 0, 0, 0);
      const tomorrow6AM = new Date(now);
      tomorrow6AM.setDate(tomorrow6AM.getDate() + 1);
      tomorrow6AM.setHours(6, 0, 0, 0);
      
      if (now < next6AM) return next6AM;
      if (now < next12PM) return next12PM;
      if (now < next6PM) return next6PM;
      return tomorrow6AM;
    }
    
    // For other contests, use reduced timing
    const baseDrawTime = drawTimes[0] || '18:00';
    const [hours, minutes] = baseDrawTime.split(':').map(Number);
    
    if (template.cycleDuration) {
      const cycleDurationMs = template.cycleDuration;
      const nextDraw = new Date(now.getTime() + cycleDurationMs);
      nextDraw.setHours(hours, minutes, 0, 0);
      return nextDraw;
    }
    
    // Fallback
    const nextDraw = new Date(now);
    nextDraw.setDate(nextDraw.getDate() + 1);
    nextDraw.setHours(hours, minutes, 0, 0);
    return nextDraw;
  }

  startLifecycleManager() {
    if (this.lifecycleInterval) {
      clearInterval(this.lifecycleInterval);
    }

    this.lifecycleInterval = setInterval(() => {
      this.checkContestLifecycle();
    }, 10000); // Check every 10 seconds

    console.log('✅ Contest lifecycle manager started');
  }

  async checkContestLifecycle() {
    const now = new Date();
    
    for (const contest of this.activeContests) {
      if (contest.status === 'active' && now >= new Date(contest.endTime)) {
        console.log(`Contest ${contest.id} ended, processing results...`);
        await this.processContestEnd(contest);
      }
    }
  }

  async processContestEnd(contest) {
    try {
      contest.status = 'processing';
      
      // Auto-declare winners and update profiles
      await this.declareWinnersAndUpdateProfiles(contest);
      
      // Schedule restart
      setTimeout(() => {
        this.restartContest(contest.id);
      }, 60000); // Restart after 1 minute
      
    } catch (error) {
      console.error(`Error processing contest end for ${contest.id}:`, error);
    }
  }

  async declareWinnersAndUpdateProfiles(contest) {
    if (!db) return;

    try {
      // Get real participants
      const usersSnapshot = await db.collection('users').get();
      const realParticipants = [];

      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        const userJoinedContests = userData.joinedContests || [];
        const contestEntries = userJoinedContests.filter(jc => 
          jc.contestId === contest.id && jc.status === 'joined'
        );

        if (contestEntries.length > 0) {
          realParticipants.push({
            uid: doc.id,
            userData: userData,
            entryCount: contestEntries.length
          });
        }
      });

      console.log(`Found ${realParticipants.length} real participants for ${contest.id}`);

      // Select compensation winners
      const compensationWinners = [];
      if (realParticipants.length > 0 && contest.compensationPrizes) {
        const maxRealWinners = Math.min(contest.compensationPrizes.realWinners, realParticipants.length);
        const shuffled = [...realParticipants].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < Math.min(maxRealWinners, shuffled.length); i++) {
          const participant = shuffled[i];
          compensationWinners.push({
            uid: participant.uid,
            userData: participant.userData,
            prize: contest.compensationPrizes.amount,
            position: '4th Prize (Compensation)'
          });
        }
      }

      // Process winners with automated profile updates
      if (compensationWinners.length > 0) {
        const batch = db.batch();

        for (const winner of compensationWinners) {
          const userRef = db.collection('users').doc(winner.uid);

          // Create win transaction
          const winTransaction = {
            type: 'prize_win',
            amount: winner.prize,
            description: `Won ${winner.position} in ${contest.title}`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: 'completed',
            contestId: contest.id,
            position: winner.position,
            automated: true
          };

          // Update user's joined contests
          const updatedJoinedContests = winner.userData.joinedContests.map(jc => {
            if (jc.contestId === contest.id && jc.status === 'joined') {
              return {
                ...jc,
                status: 'won',
                position: winner.position,
                prizeWon: winner.prize,
                contestState: 'completed',
                automatedUpdate: true
              };
            }
            return jc;
          });

          // Automated profile update
          batch.update(userRef, {
            balance: admin.firestore.FieldValue.increment(winner.prize),
            contestsWon: admin.firestore.FieldValue.increment(1),
            totalWinnings: admin.firestore.FieldValue.increment(winner.prize),
            joinedContests: updatedJoinedContests,
            forceRefresh: true, // Trigger profile automation
            lastAutomatedUpdate: admin.firestore.FieldValue.serverTimestamp()
          });

          // Add transaction
          const transactionRef = userRef.collection('transactions').doc();
          batch.set(transactionRef, winTransaction);
        }

        // Update non-winners
        const nonWinners = realParticipants.filter(p => 
          !compensationWinners.some(w => w.uid === p.uid)
        );

        for (const participant of nonWinners) {
          const userRef = db.collection('users').doc(participant.uid);
          const updatedJoinedContests = participant.userData.joinedContests.map(jc => {
            if (jc.contestId === contest.id && jc.status === 'joined') {
              return {
                ...jc,
                status: 'completed',
                position: null,
                prizeWon: 0,
                contestState: 'completed',
                automatedUpdate: true
              };
            }
            return jc;
          });

          batch.update(userRef, {
            joinedContests: updatedJoinedContests,
            forceRefresh: true, // Trigger profile automation
            lastAutomatedUpdate: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        await batch.commit();
        console.log(`✅ Automated profile updates for ${realParticipants.length} participants`);
      }

      contest.status = 'completed';
      contest.completedAt = new Date();

    } catch (error) {
      console.error('Error in automated winner declaration:', error);
    }
  }

  async restartContest(contestId) {
    const contestIndex = this.activeContests.findIndex(c => c.id === contestId);
    if (contestIndex === -1) return;

    const template = CONTEST_TEMPLATES.find(t => t.id === contestId);
    if (!template) return;

    try {
      const newEndTime = this.calculateNextDrawTime(template);
      const cycleNumber = (this.activeContests[contestIndex].cycleNumber || 0) + 1;
      
      const restartedContest = {
        ...template,
        currentParticipants: Math.floor(Math.random() * 20) + 5,
        endTime: newEndTime,
        status: 'active',
        participants: [],
        createdAt: new Date(),
        isActive: true,
        cycleNumber: cycleNumber,
        title: `${template.title} - Cycle ${cycleNumber}`,
        autoRestarted: true
      };

      this.activeContests[contestIndex] = restartedContest;

      if (db) {
        await db.collection('contests').doc(contestId).set(restartedContest);
      }

      console.log(`✅ Contest ${contestId} restarted - Cycle ${cycleNumber}`);

    } catch (error) {
      console.error(`Error restarting contest ${contestId}:`, error);
    }
  }
}

// API Routes
app.get('/api/contests', async (req, res) => {
  try {
    if (contestManager.activeContests.length === 0) {
      await contestManager.initialize();
    }
    res.json({
      success: true,
      contests: contestManager.activeContests,
      timestamp: new Date().toISOString(),
      timingReduced: true
    });
  } catch (error) {
    console.error('Error fetching contests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/user/:uid', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ success: false, error: 'Database not available' });
    }

    const userDoc = await db.collection('users').doc(req.params.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Load transactions
    const transactionsSnapshot = await db.collection('users')
      .doc(req.params.uid)
      .collection('transactions')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const transactions = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      user: userData,
      transactions: transactions,
      automated: true
    });

  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/join-contest', async (req, res) => {
  try {
    const { uid, contestId, entryFee } = req.body;

    if (!db) {
      return res.status(503).json({ success: false, error: 'Database not available' });
    }

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userData = userDoc.data();
    if (userData.balance < entryFee) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    // Process contest joining with automation
    const joinedContest = {
      contestId: contestId,
      joinedDate: new Date().toLocaleDateString('en-IN'),
      joinedTime: new Date().toLocaleTimeString('en-IN'),
      entryFee: entryFee,
      status: 'joined',
      prizeWon: 0,
      position: null,
      contestState: 'active',
      automated: true
    };

    const transaction = {
      type: 'contest_entry',
      amount: -entryFee,
      description: `Joined contest: ${contestId}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'completed',
      contestId: contestId,
      automated: true
    };

    const batch = db.batch();

    batch.update(userRef, {
      balance: admin.firestore.FieldValue.increment(-entryFee),
      contestsJoined: admin.firestore.FieldValue.increment(1),
      joinedContests: admin.firestore.FieldValue.arrayUnion(joinedContest),
      forceRefresh: true // Trigger automated profile update
    });

    const transactionRef = userRef.collection('transactions').doc();
    batch.set(transactionRef, transaction);

    await batch.commit();

    res.json({
      success: true,
      message: 'Contest joined successfully',
      automated: true
    });

  } catch (error) {
    console.error('Error joining contest:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    firebase: !!db,
    automation: profileAutomation.isRunning,
    contests: contestManager.activeContests.length,
    timingReduced: true
  });
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'attached_assets', 'index_1751429399286.html'));
});

// Initialize services
const profileAutomation = new ProfileAutomationService();
const contestManager = new ContestManager();

// Start the server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Access at: http://localhost:${PORT}`);
  
  // Initialize automated services
  if (db) {
    console.log('🔄 Starting automated services...');
    profileAutomation.start();
    await contestManager.initialize();
    console.log('✅ All services initialized with reduced timing');
  } else {
    console.log('⚠️ Running in development mode without Firebase');
    await contestManager.initialize();
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  profileAutomation.stop();
  if (contestManager.lifecycleInterval) {
    clearInterval(contestManager.lifecycleInterval);
  }
  process.exit(0);
});
