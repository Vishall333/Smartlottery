
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

// Contest templates with reduced timing (1 day less)
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

// Contest management system with enhanced participant tracking
class ContestManager {
  constructor() {
    this.activeContests = [];
    this.lifecycleInterval = null;
    this.participantUpdateInterval = null;
  }

  async initialize() {
    try {
      if (!db) {
        console.log('⚠️ Database not available, using local contests');
        this.createLocalContests();
        this.startParticipantUpdater();
        return;
      }

      console.log('🔄 Initializing contest management...');
      await this.loadOrCreateContests();
      this.startLifecycleManager();
      this.startParticipantUpdater();
      
    } catch (error) {
      console.error('❌ Error initializing contests:', error);
      this.createLocalContests();
      this.startParticipantUpdater();
    }
  }

  createLocalContests() {
    this.activeContests = CONTEST_TEMPLATES.map(template => {
      const baseParticipants = Math.floor(template.maxParticipants * 0.15); // Start with 15%
      return {
        ...template,
        currentParticipants: baseParticipants,
        baseParticipants: baseParticipants,
        endTime: this.calculateNextDrawTime(template),
        status: 'active',
        participants: [],
        createdAt: new Date(),
        isActive: true,
        cycleNumber: 1,
        title: `${template.title} - Cycle 1`
      };
    });
    console.log('✅ Created local contests with realistic participant counts');
  }

  // Enhanced participant updater that reaches 90% when 1 hour is left
  startParticipantUpdater() {
    this.participantUpdateInterval = setInterval(() => {
      this.updateParticipantCounts();
    }, 30000); // Update every 30 seconds
    console.log('✅ Participant count updater started');
  }

  updateParticipantCounts() {
    const now = new Date();
    
    this.activeContests.forEach(contest => {
      if (contest.status !== 'active') return;

      const endTime = new Date(contest.endTime);
      const timeLeft = endTime.getTime() - now.getTime();
      const totalDuration = contest.cycleDuration;
      const oneHourMs = 60 * 60 * 1000; // 1 hour in milliseconds
      
      let targetParticipants;
      
      if (timeLeft <= oneHourMs) {
        // In last hour, reach 90% of max participants
        targetParticipants = Math.floor(contest.maxParticipants * 0.9);
      } else {
        // Gradually increase from base (15%) to target (75%) before last hour
        const progressRatio = 1 - (timeLeft / totalDuration);
        const baseRatio = 0.15; // Start at 15%
        const preLastHourRatio = 0.75; // Reach 75% before last hour
        
        const currentRatio = baseRatio + (progressRatio * (preLastHourRatio - baseRatio));
        targetParticipants = Math.floor(contest.maxParticipants * Math.min(currentRatio, preLastHourRatio));
      }
      
      // Ensure participants only increase, never decrease
      if (targetParticipants > contest.currentParticipants) {
        const increase = Math.min(
          Math.ceil((targetParticipants - contest.currentParticipants) / 10), // Gradual increase
          targetParticipants - contest.currentParticipants
        );
        contest.currentParticipants = Math.min(
          contest.currentParticipants + increase,
          contest.maxParticipants
        );
      }
    });
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
        const baseParticipants = Math.floor(template.maxParticipants * 0.15);
        
        const updatedContest = {
          ...template,
          currentParticipants: baseParticipants,
          baseParticipants: baseParticipants,
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
        console.log('✅ Updated contests with reduced timing and realistic participants');
      }
      
      this.activeContests = updatedContests;
    } else {
      // Create fresh contests
      const contests = CONTEST_TEMPLATES.map(template => {
        const endTime = this.calculateNextDrawTime(template);
        const cycleNumber = 1;
        const baseParticipants = Math.floor(template.maxParticipants * 0.15);
        
        return {
          ...template,
          currentParticipants: baseParticipants,
          baseParticipants: baseParticipants,
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
      console.log('✅ Created new contests with realistic participant distribution');
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
      const baseParticipants = Math.floor(template.maxParticipants * 0.15);
      
      const restartedContest = {
        ...template,
        currentParticipants: baseParticipants,
        baseParticipants: baseParticipants,
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

// Enhanced Payment verification system with stricter QR verification
class PaymentProcessor {
  constructor() {
    this.pendingPayments = new Map();
    this.verificationInterval = null;
    this.qrPaymentAttempts = new Map(); // Track QR payment attempts
  }

  start() {
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
    }

    // Check for payment confirmations every 15 seconds (increased from 10)
    this.verificationInterval = setInterval(() => {
      this.processPaymentVerifications();
    }, 15000);

    console.log('✅ Enhanced payment verification system started');
  }

  async processPaymentVerifications() {
    if (!db) return;

    try {
      // Get pending payments from Firestore
      const pendingPaymentsSnapshot = await db.collection('pendingPayments')
        .where('status', '==', 'pending')
        .limit(20)
        .get();

      if (pendingPaymentsSnapshot.empty) return;

      const batch = db.batch();
      let processedCount = 0;

      for (const paymentDoc of pendingPaymentsSnapshot.docs) {
        const paymentData = paymentDoc.data();
        const timeSinceCreated = Date.now() - paymentData.createdAt;

        // For QR/UPI payments, NEVER auto-credit - require admin verification
        if (paymentData.method && ['gpay', 'phonepe', 'paytm'].includes(paymentData.method)) {
          // QR payments must be manually verified by admin - NO AUTO-CREDITING
          if (paymentData.adminVerified && paymentData.manuallyConfirmed && timeSinceCreated > 5 * 60 * 1000) {
            await this.creditUserBalance(paymentData, batch);
            
            batch.update(paymentDoc.ref, {
              status: 'completed',
              completedAt: admin.firestore.FieldValue.serverTimestamp(),
              adminVerified: true,
              verificationMethod: 'admin_manual_verification'
            });

            processedCount++;
          }
          // Skip auto-processing for QR payments without admin verification
          continue;
        } else {
          // Auto-approve non-QR payments after 3 minutes (increased from 2)
          if (timeSinceCreated > 3 * 60 * 1000) {
            await this.creditUserBalance(paymentData, batch);
            
            batch.update(paymentDoc.ref, {
              status: 'completed',
              completedAt: admin.firestore.FieldValue.serverTimestamp(),
              autoVerified: true,
              verificationMethod: 'time_based'
            });

            processedCount++;
          }
        }
      }

      if (processedCount > 0) {
        await batch.commit();
        console.log(`✅ Auto-credited ${processedCount} verified payments`);
      }

    } catch (error) {
      console.error('Error processing payment verifications:', error);
    }
  }

  async creditUserBalance(paymentData, batch) {
    if (!paymentData.userId || !paymentData.amount) return;

    try {
      const userRef = db.collection('users').doc(paymentData.userId);
      
      // Credit user balance
      batch.update(userRef, {
        balance: admin.firestore.FieldValue.increment(paymentData.amount),
        lastPaymentAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create transaction record
      const transactionRef = userRef.collection('transactions').doc();
      batch.set(transactionRef, {
        type: 'deposit',
        amount: paymentData.amount,
        description: `Payment credited - ${paymentData.method || 'Online'}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed',
        paymentId: paymentData.paymentId,
        method: paymentData.method || 'Online',
        autoVerified: true,
        date: new Date().toLocaleDateString('en-IN'),
        time: new Date().toLocaleTimeString('en-IN')
      });

      console.log(`💰 Credited ₹${paymentData.amount} to user ${paymentData.userId}`);

    } catch (error) {
      console.error('Error crediting user balance:', error);
    }
  }

  async recordPayment(userId, amount, method, paymentId) {
    if (!db) return null;

    try {
      const paymentRecord = {
        userId: userId,
        amount: amount,
        method: method,
        paymentId: paymentId,
        status: 'pending_verification',
        createdAt: Date.now(),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        manuallyConfirmed: false,
        adminVerified: false, // QR payments require admin verification
        requiresAdminApproval: ['gpay', 'phonepe', 'paytm'].includes(method)
      };

      const docRef = await db.collection('pendingPayments').add(paymentRecord);
      console.log(`📝 Recorded pending payment: ${paymentId} for ₹${amount} via ${method}`);
      
      return docRef.id;
    } catch (error) {
      console.error('Error recording payment:', error);
      return null;
    }
  }

  stop() {
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
      this.verificationInterval = null;
    }
    console.log('⏹️ Payment verification system stopped');
  }
}

// Profile automation service
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

// Enhanced payment initiation endpoint
app.post('/api/initiate-payment', async (req, res) => {
  try {
    const { uid, amount, method, email } = req.body;

    if (!uid || !amount || amount < 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid payment data' 
      });
    }

    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not available' 
      });
    }

    // Generate unique payment ID
    const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Record the payment as pending
    const recordId = await paymentProcessor.recordPayment(uid, amount, method, paymentId);
    
    if (!recordId) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to record payment' 
      });
    }

    // Different messages for different payment methods
    let message = 'Payment initiated successfully.';
    if (['gpay', 'phonepe', 'paytm'].includes(method)) {
      message = 'QR payment initiated. Please complete the payment and contact admin for verification.';
    } else {
      message = 'Payment initiated successfully. Your balance will be credited automatically within 3-5 minutes.';
    }

    // Return payment details for frontend
    res.json({
      success: true,
      paymentId: paymentId,
      recordId: recordId,
      amount: amount,
      method: method,
      message: message,
      requiresAdminVerification: ['gpay', 'phonepe', 'paytm'].includes(method)
    });

  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Enhanced payment confirmation endpoint (removed manual confirmation for QR)
app.post('/api/confirm-payment', async (req, res) => {
  try {
    const { paymentId, recordId, uid } = req.body;

    if (!paymentId || !recordId || !uid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing payment information' 
      });
    }

    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not available' 
      });
    }

    // Get payment record
    const paymentDoc = await db.collection('pendingPayments').doc(recordId).get();
    
    if (!paymentDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Payment record not found' 
      });
    }

    const paymentData = paymentDoc.data();
    
    if (paymentData.userId !== uid) {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized access to payment' 
      });
    }

    if (paymentData.status === 'completed') {
      return res.json({
        success: true,
        message: 'Payment already processed',
        alreadyProcessed: true
      });
    }

    // For QR payments, require admin verification - NO MANUAL CONFIRMATION
    if (['gpay', 'phonepe', 'paytm'].includes(paymentData.method)) {
      return res.json({
        success: false,
        message: 'QR payments require admin verification. Manual confirmation disabled for security.',
        requiresAdminVerification: true
      });
    } else {
      // For non-QR payments, process immediately
      const batch = db.batch();
      await paymentProcessor.creditUserBalance(paymentData, batch);
      
      // Update payment status
      batch.update(paymentDoc.ref, {
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        autoVerified: true
      });

      await batch.commit();

      return res.json({
        success: true,
        message: 'Payment confirmed and credited successfully',
        amount: paymentData.amount
      });
    }

  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin verification endpoint for QR payments
app.post('/api/admin/verify-payment', async (req, res) => {
  try {
    const { recordId, adminKey, verified } = req.body;

    // Simple admin verification (in production, use proper authentication)
    if (adminKey !== 'ADMIN_VERIFY_2024') {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized admin access' 
      });
    }

    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not available' 
      });
    }

    const paymentDoc = await db.collection('pendingPayments').doc(recordId).get();
    
    if (!paymentDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Payment not found' 
      });
    }

    const paymentData = paymentDoc.data();

    if (verified) {
      // Admin approved - credit the user
      const batch = db.batch();
      await paymentProcessor.creditUserBalance(paymentData, batch);
      
      batch.update(paymentDoc.ref, {
        status: 'completed',
        adminVerified: true,
        adminVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await batch.commit();

      res.json({
        success: true,
        message: 'Payment verified and credited successfully'
      });
    } else {
      // Admin rejected
      await paymentDoc.ref.update({
        status: 'rejected',
        adminVerified: false,
        adminRejectedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({
        success: true,
        message: 'Payment rejected'
      });
    }

  } catch (error) {
    console.error('Error in admin verification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get payment status endpoint
app.get('/api/payment-status/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const { uid } = req.query;

    if (!recordId || !uid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing parameters' 
      });
    }

    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not available' 
      });
    }

    const paymentDoc = await db.collection('pendingPayments').doc(recordId).get();
    
    if (!paymentDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Payment not found' 
      });
    }

    const paymentData = paymentDoc.data();
    
    if (paymentData.userId !== uid) {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }

    res.json({
      success: true,
      status: paymentData.status,
      amount: paymentData.amount,
      method: paymentData.method,
      createdAt: paymentData.createdAt,
      completedAt: paymentData.completedAt || null,
      requiresAdminVerification: paymentData.requiresAdminApproval || false
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
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
    timingReduced: true,
    paymentSecurity: 'enhanced',
    qrPaymentGlitchFixed: true,
    participantGrowthAlgorithm: 'dynamic_90_percent_final_hour'
  });
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'attached_assets', 'index_1751456993829.html'));
});

// Initialize services
const profileAutomation = new ProfileAutomationService();
const contestManager = new ContestManager();
const paymentProcessor = new PaymentProcessor();

// Start the server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Access at: http://localhost:${PORT}`);
  
  // Initialize automated services
  if (db) {
    console.log('🔄 Starting automated services...');
    profileAutomation.start();
    paymentProcessor.start();
    await contestManager.initialize();
    console.log('✅ All services initialized with enhanced security and realistic participant management');
  } else {
    console.log('⚠️ Running in development mode without Firebase');
    await contestManager.initialize();
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  profileAutomation.stop();
  paymentProcessor.stop();
  if (contestManager.lifecycleInterval) {
    clearInterval(contestManager.lifecycleInterval);
  }
  if (contestManager.participantUpdateInterval) {
    clearInterval(contestManager.participantUpdateInterval);
  }
  process.exit(0);
});
