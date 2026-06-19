require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

// Force Node.js c-ares to use public DNS servers (resolves SRV resolution issues on some local networks/Windows configurations)
try {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
} catch (e) {
  console.warn('⚠️ Failed to set custom DNS servers:', e.message);
}
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out to preserve existing data)
    // await Admin.deleteMany({});

    // Create admin if not exists
    const existingAdmin = await Admin.findOne({ email: 'admin@ssuet.edu.pk' });
    if (!existingAdmin) {
      await Admin.create({
        name: 'SSUET Administrator',
        email: 'admin@ssuet.edu.pk',
        password: 'Admin@123'
      });
      console.log('✅ Admin created: admin@ssuet.edu.pk / Admin@123');
    } else {
      console.log('ℹ️  Admin already exists');
    }

    // Seed sample events
    const eventsCount = await Event.countDocuments();
    if (eventsCount === 0) {
      const sampleEvents = [
        {
          title: 'Annual Tech Symposium 2024',
          description: 'A grand gathering of technology enthusiasts, researchers, and industry professionals to discuss the latest innovations in computing and engineering. Featuring keynote speeches, panel discussions, and hands-on workshops.',
          category: 'Technical',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          time: '09:00 AM',
          venue: 'Main Auditorium, SSUET',
          organizer: 'Department of Computer Engineering',
          maxParticipants: 200,
          status: 'upcoming',
          tags: ['technology', 'innovation', 'engineering'],
          requiresApproval: false
        },
        {
          title: 'Coding Hackathon Spring 2024',
          description: 'A 24-hour coding competition where teams compete to build innovative software solutions. Open to all SSUET students. Winners receive exciting prizes and internship opportunities.',
          category: 'Competition',
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          time: '10:00 AM',
          venue: 'Computer Lab Block A, SSUET',
          organizer: 'Software Engineering Society',
          maxParticipants: 100,
          status: 'upcoming',
          tags: ['coding', 'hackathon', 'competition', 'prizes'],
          requiresApproval: false
        },
        {
          title: 'Cultural Fest 2024',
          description: 'Celebrate the diverse culture of SSUET with music, dance performances, art exhibitions, and food stalls. A day full of entertainment and cultural exchange.',
          category: 'Cultural',
          date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          time: '02:00 PM',
          venue: 'SSUET Sports Ground',
          organizer: 'Student Affairs Department',
          maxParticipants: 500,
          status: 'upcoming',
          tags: ['culture', 'music', 'dance', 'entertainment'],
          requiresApproval: false
        },
        {
          title: 'AI & Machine Learning Workshop',
          description: 'Hands-on workshop covering fundamentals of Artificial Intelligence and Machine Learning. Participants will build their first ML model using Python and popular libraries.',
          category: 'Workshop',
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          time: '11:00 AM',
          venue: 'Seminar Hall B, SSUET',
          organizer: 'Department of Computer Engineering',
          maxParticipants: 50,
          status: 'upcoming',
          tags: ['AI', 'machine learning', 'python', 'workshop'],
          requiresApproval: true,
          registrationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        },
        {
          title: 'Inter-University Cricket Tournament',
          description: 'Annual cricket tournament bringing together teams from top universities across Pakistan. Come support SSUET Cricket Team in their quest for the championship!',
          category: 'Sports',
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          time: '08:00 AM',
          venue: 'SSUET Cricket Ground',
          organizer: 'Sports Department',
          maxParticipants: 300,
          status: 'upcoming',
          tags: ['cricket', 'sports', 'tournament'],
          requiresApproval: false
        },
        {
          title: 'Research Paper Presentation Seminar',
          description: 'An academic seminar where students and faculty present their latest research findings across various engineering disciplines. A great opportunity to learn and network.',
          category: 'Seminar',
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          time: '10:00 AM',
          venue: 'Conference Room, SSUET',
          organizer: 'Research & Development Cell',
          maxParticipants: 80,
          status: 'upcoming',
          tags: ['research', 'academic', 'seminar'],
          requiresApproval: false
        }
      ];

      await Event.insertMany(sampleEvents);
      console.log('✅ Sample events created');
    } else {
      console.log('ℹ️  Events already exist');
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin Login:');
    console.log('  Email   : admin@ssuet.edu.pk');
    console.log('  Password: Admin@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedData();
