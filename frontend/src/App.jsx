import React, { useState, useEffect } from 'react';
import { where, orderBy,} from "firebase/firestore";
// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInAnonymously
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  doc,
  setDoc,
  serverTimestamp,
  setLogLevel
} from 'firebase/firestore';

// --- Local Firebase Config ---
import firebaseConfig from './firebaseConfig.js';

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Use the projectId as a safe and unique app ID
const appId = firebaseConfig.projectId || 'default-clean-up-app';

// Enable detailed logging for Firestore
setLogLevel('debug');

// --- Firebase Collection References ---
const getCollectionRef = (collectionName) => {
  return collection(db, `artifacts/${appId}/public/data/${collectionName}`);
};

const eventsColRef = getCollectionRef('events');
const wasteColRef = getCollectionRef('wasteEntries');
const tipsColRef = getCollectionRef('tips');

// --- Helper Functions ---
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// --- React Components ---

/**
 * Main Application Component
 */
export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [page, setPage] = useState('home');

  // Effect for handling authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!isAuthReady) {
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, [isAuthReady]);

  // Loading screen
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading Clean-Up Tracker...</div>
      </div>
    );
  }

  // If no "real" user, show Auth Page
  if (!user || user.isAnonymous) {
    return <AuthPage />;
  }

  // If user is logged in, show the main app
  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <Navbar user={user} setPage={setPage} />
      <main className="p-4 mx-auto max-w-7xl md:p-8">
        {page === 'home' && <HomePage setPage={setPage} />}
        {page === 'events' && <EventsPage user={user} />}
        {page === 'dashboard' && <DashboardPage user={user} />}
        {page === 'awareness' && <AwarenessPage user={user} />}
      </main>
      <Footer />
    </div>
  );
}

/**
 * Authentication Page (Login/Signup)
 */
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Sign out any anonymous user first
    if (auth.currentUser && auth.currentUser.isAnonymous) {
      await signOut(auth);
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      switch (err.code) {
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Invalid email or password.');
          break;
        case 'auth/email-already-in-use':
          setError('An account with this email already exists. Please log in.');
          break;
        case 'auth/weak-password':
          setError('Password must be at least 6 characters long.');
          break;
        default:
          setError('Failed to sign in. Please try again.');
      }
      console.error("Auth error:", err.message, err.code);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 mx-4 bg-white rounded-xl shadow-2xl">
        <div className="flex items-center justify-center mb-6 space-x-2">
          <span className="text-4xl font-bold text-emerald-600">🌿</span>
          <h1 className="text-2xl font-bold text-gray-800">Clean-Up Tracker</h1>
        </div>
        <h2 className="text-xl font-semibold text-center text-gray-700">
          {isLogin ? 'Welcome Back!' : 'Create Your Account'}
        </h2>
        <p className="mb-6 text-sm text-center text-gray-500">
          {isLogin ? 'Log in to continue' : 'Join the community'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          {error && (
            <p className="text-sm text-center text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 font-medium text-white bg-emerald-600 rounded-full shadow-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            {loading ? 'Loading...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError(null);
          }}
          className="w-full mt-4 text-sm text-center text-emerald-600 hover:text-emerald-800"
        >
          {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Log In'}
        </button>
      </div>
    </div>
  );
}


/**
 * Navigation Bar
 */
function Navbar({ user, setPage }) {
  const navItems = [
    { name: 'Home', page: 'home' },
    { name: 'Events', page: 'events' },
    { name: 'Dashboard', page: 'dashboard' },
    { name: 'Awareness', page: 'awareness' },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="flex flex-wrap items-center justify-between p-4 mx-auto max-w-7xl">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setPage('home')}>
          <span className="text-2xl font-bold text-emerald-600">🌿</span>
          <span className="text-xl font-bold text-gray-800">Clean-Up Tracker</span>
        </div>
        <div className="flex items-center order-3 w-full mt-4 space-x-2 md:order-2 md:w-auto md:mt-0 md:space-x-4">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => setPage(item.page)}
              className="px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="flex items-center order-2 space-x-4 md:order-3">
          <div className="hidden text-xs text-gray-500 md:block">
            User: <span className="font-mono" title={user.email || user.uid}>
              {user.email || user.uid.substring(0, 10) + "..."}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

/**
 * Home Page Component
 */
function HomePage({ setPage }) {
  return (
    <div className="p-8 bg-white rounded-xl shadow-lg">
      <div className="text-center">
        <div className="p-10 mb-6 bg-gray-200 rounded-lg">
            <span className="text-5xl">🇵🇭</span>
            <h1 className="mt-2 text-2xl font-bold text-gray-700">For Las Piñas</h1>
        </div>
        <h2 className="mt-4 text-3xl font-bold text-gray-900 md:text-4xl">
          Help Keep Las Piñas Clean
        </h2>
        <p className="max-w-2xl mx-auto mt-4 text-lg text-gray-600">
          Our community is deeply affected by flooding, often made worse by improper waste.
          This platform helps us organize, track our efforts, and build awareness together.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 mt-12 md:grid-cols-3">
        <div className="flex flex-col items-center p-6 text-center bg-emerald-50 rounded-lg shadow-sm">
          <span className="text-5xl">🙌</span>
          <h3 className="mt-4 text-xl font-semibold text-emerald-700">Mobilize</h3>
          <p className="mt-2 text-gray-600">
            Find and join clean-up events happening near you.
          </p>
          <button
            onClick={() => setPage('events')}
            className="mt-6 px-6 py-2 font-medium text-white bg-emerald-600 rounded-full shadow-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            See Events
          </button>
        </div>
        <div className="flex flex-col items-center p-6 text-center bg-blue-50 rounded-lg shadow-sm">
          <span className="text-5xl">📊</span>
          <h3 className="mt-4 text-xl font-semibold text-blue-700">Track & Manage</h3>
          <p className="mt-2 text-gray-600">
            Log the waste you collect to see our collective impact.
          </p>
          <button
            onClick={() => setPage('dashboard')}
            className="mt-6 px-6 py-2 font-medium text-white bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Data
          </button>
        </div>
        <div className="flex flex-col items-center p-6 text-center bg-yellow-50 rounded-lg shadow-sm">
          <span className="text-5xl">💡</span>
          <h3 className="mt-4 text-xl font-semibold text-yellow-700">Raise Awareness</h3>
          <p className="mt-2 text-gray-600">
            Learn and share tips for a more sustainable community.
          </p>
          <button
            onClick={() => setPage('awareness')}
            className="mt-6 px-6 py-2 font-medium text-white bg-yellow-600 rounded-full shadow-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Events Page (Mobilize)
 */
function EventsPage({ user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // ✅ FIX: Real-time listener ordered by createdAt
    const q = query(eventsColRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const eventsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEvents(eventsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching events:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">
        Community Clean-Up Events
      </h1>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="pb-2 mb-4 text-xl font-semibold text-gray-700 border-b-2">
            Upcoming Events
          </h2>
          {loading && <p>Loading events...</p>}
          {!loading && events.length === 0 && (
            <div className="p-6 text-center bg-gray-100 rounded-lg">
              <p className="text-gray-600">
                No events scheduled. Why not create one?
              </p>
            </div>
          )}
          <div className="space-y-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} user={user} />
            ))}
          </div>
        </div>
        <div className="md:col-span-1">
          <CreateEventForm user={user} />
        </div>
      </div>
    </div>
  );
}

/**
 * Event Card Component
 */
function EventCard({ event, user }) {
  const [isJoining, setIsJoining] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const isCreator = user && user.uid === event.creatorId;

  const handleJoin = async () => {
    if (!user) return;
    setIsJoining(true);
    console.log(`User ${user.uid} joining event ${event.id}`);
    setTimeout(() => {
      setShowModal(true);
      setIsJoining(false);
    }, 1000);
  };

  const handleDelete = async () => {
    if (!isCreator) return;
    // In a real app, you'd confirm this
    // const eventRef = doc(db, eventsColRef.path, event.id);
    // await deleteDoc(eventRef);
    console.log(`User ${user.uid} is deleting event ${event.id}`);
  };

  return (
    <>
      <div className="relative p-6 bg-white rounded-xl shadow-lg transition-all hover:shadow-xl">
        {isCreator && (
          <button
            onClick={handleDelete}
            title="Delete this event"
            className="absolute top-2 right-2 px-2 py-1 text-xs text-red-600 bg-red-100 rounded-full hover:bg-red-200"
          >
            Delete
          </button>
        )}
        <h3 className="text-xl font-bold text-emerald-700">{event.title}</h3>
        <p className="mt-2 text-gray-600">{event.description}</p>
        <div className="mt-4 text-sm text-gray-800">
          <p><span className="font-semibold">Location:</span> {event.location}</p>
          <p><span className="font-semibold">Date:</span> {event.date}</p>
          <p className="text-xs text-gray-500">
            Created by: <span className="font-mono" title={event.creatorEmail}>{event.creatorEmail || (event.creatorId ? event.creatorId.substring(0, 10) : '...')}...</span>
          </p>
        </div>
        <button
          onClick={handleJoin}
          disabled={isJoining}
          className="mt-6 px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-full shadow-lg hover:bg-emerald-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          {isJoining ? "Joining..." : "Join Event"}
        </button>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-6 bg-white rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold">Thank you!</h3>
            <p className="mt-2">You have successfully joined "{event.title}".</p>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 px-4 py-2 text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Create Event Form
 */
function CreateEventForm({ user }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      await addDoc(eventsColRef, {
        title,
        description,
        location,
        date,
        creatorId: user.uid,
        creatorEmail: user.email || null,
        createdAt: serverTimestamp()
      });
      setTitle('');
      setDescription('');
      setLocation('');
      setDate('');
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      // **BUG FIX**: This was missing
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-xl shadow-lg space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Create a New Event</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">Event Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows="3"
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-2 font-medium text-white bg-emerald-600 rounded-full shadow-lg hover:bg-emerald-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        {isSubmitting ? "Creating..." : "Create Event"}
      </button>
    </form>
  );
}


/**
 * Dashboard Page
 */
function DashboardPage({ user }) {
  const [wasteEntries, setWasteEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchWasteEntries = async () => {
      try {
        setLoading(true);
        const res = await fetch("https://clean-up-tracker-01l8.onrender.com/api/waste");
        const data = await res.json();

        // Filter entries by logged-in user
        const filtered = data
          .filter((entry) => entry.submitterId === user.uid)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setWasteEntries(filtered);
      } catch (error) {
        console.error("Error fetching waste entries:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const res = await fetch("https://clean-up-tracker-01l8.onrender.com/api/stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    // Initial loads
    fetchWasteEntries();
    fetchStats();

    // 🕒 Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchWasteEntries();
      fetchStats();
    }, 10000);

    // 🔄 Refresh immediately when a new waste entry is added
    const listener = () => {
      fetchWasteEntries();
      fetchStats();
    };
    window.addEventListener("waste-updated", listener);

    return () => {
      clearInterval(interval);
      window.removeEventListener("waste-updated", listener);
    };
  }, [user]);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">
        Waste Collection Dashboard
      </h1>

      {/* ✅ Summary Section */}
      {stats && (
        <div className="p-6 mb-8 bg-white rounded-xl shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Collection Summary
          </h2>
          <p className="text-gray-800 font-medium">
            Total Entries: {stats.totalEntries}
          </p>

          <div className="mt-4">
            <h3 className="font-semibold text-gray-700">By Waste Type:</h3>
            <ul className="mt-1 text-gray-600 text-sm">
              {Object.entries(stats.totalsByType || {}).map(([type, count]) => (
                <li key={type}>
                  <span className="font-medium">{type}</span>: {count}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ✅ Layout with Form + Entries */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <SubmitWasteForm user={user} />
        </div>

        <div className="md:col-span-2">
          <h2 className="pb-2 mb-4 text-xl font-semibold text-gray-700 border-b-2">
            Recent Entries
          </h2>

          <div className="p-6 bg-white rounded-xl shadow-lg">
            {loading && <p>Loading entries...</p>}

            {!loading && wasteEntries.length === 0 && (
              <div className="p-6 text-center bg-gray-100 rounded-lg">
                <p className="text-gray-600">
                  No waste entries submitted yet.
                </p>
              </div>
            )}

            <ul className="space-y-4">
              {wasteEntries.slice(0, 10).map((entry) => (
                <li
                  key={entry.id}
                  className="p-4 border rounded-md bg-gray-50"
                >
                  <span className="font-semibold text-blue-700">
                    {entry.type}
                  </span>
                  : <span className="ml-2 font-bold">{entry.volume}</span>
                  <span className="text-sm text-gray-600"> (bags/kg)</span>
                  <p className="text-xs text-gray-500">
                    at {entry.location}
                  </p>
                  <p className="text-xs text-gray-500">
                    Logged by:{" "}
                    <span
                      className="font-mono"
                      title={entry.submitterEmail}
                    >
                      {entry.submitterEmail ||
                        (entry.submitterId
                          ? entry.submitterId.substring(0, 10)
                          : "...")}
                      ...
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}



/**
 * Submit Waste Form
 */
function SubmitWasteForm({ user }) {
  const [type, setType] = useState("Mixed");
  const [volume, setVolume] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wasteTypes = ["Mixed", "Plastic", "Paper", "Glass", "Organic", "Other"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("http://localhost:5000/api/waste", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          volume,
          location,
          user: {
            uid: user.uid,
            email: user.email,
          },
        }),
      });

      if (res.ok) {
        alert("✅ Waste entry submitted!");
        setType("Mixed");
        setVolume("");
        setLocation("");

        // 🆕 Trigger dashboard refresh event
        window.dispatchEvent(new Event("waste-updated"));
      } else {
        const errData = await res.json();
        console.error("Error from backend:", errData);
        alert("❌ Failed to submit waste entry");
      }
    } catch (error) {
      console.error("Network error submitting waste data:", error);
      alert("❌ Could not connect to backend");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-white rounded-xl shadow-lg space-y-4"
    >
      <h2 className="text-xl font-semibold text-gray-800">
        Log Collected Waste
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Waste Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {wasteTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Volume (e.g., "10 bags" or "5 kg")
        </label>
        <input
          type="text"
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          required
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Location / Barangay
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          placeholder="e.g., Zapote, Pulang Lupa"
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-2 font-medium text-white bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {isSubmitting ? "Submitting..." : "Submit Data"}
      </button>
    </form>
  );
}


/**
 * Awareness Page
 */
function AwarenessPage({ user }) {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true); // Set loading to true when we start fetching
    const defaultTips = [
      { id: '1', title: 'Segregate Your Waste', content: 'Properly separate biodegradables (nabubulok) from non-biodegradables (di-nabubulok) to help waste collection and recycling.' },
      { id: '2', title: 'Reduce Single-Use Plastics', content: 'Bring your own eco-bag when shopping and use a reusable water bottle instead of buying bottled water.' },
      { id: '3', title: 'Conserve Water', content: 'Simple acts like turning off the tap while brushing your teeth can save gallons of water every day.' },
      { id: '4_las_pinas', title: 'Know Your Local MRF', content: 'Find your local Materials Recovery Facility (MRF) in Las Piñas to dispose of recyclables properly.' },
    ];

    const q = query(tipsColRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let tipsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })); // <-- BUG FIX: Removed extra dot from snapshot.docs..map
      if (tipsData.length === 0) {
        tipsData = defaultTips;
      }
      setTips(tipsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tips:", error);
      setTips(defaultTips);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Environmental Awareness</h1>
      <p className="mb-8 text-lg text-gray-600">
        Small changes in our daily habits can make a big difference. Here are some tips for a more sustainable community.
      </p>

      {loading && <p>Loading tips...</p>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tips.map(tip => (
          <div key={tip.id} className="p-6 bg-white rounded-xl shadow-lg transition-all hover:scale-105">
            <h3 className="text-lg font-semibold text-yellow-800">{tip.title}</h3>
            <p className="mt-2 text-gray-600">{tip.content}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

/**
 * Footer Component
 */
function Footer() {
  return (
    <footer className="py-6 mt-12 text-center text-gray-500 bg-gray-100 border-t">
      <p>&copy; {new Date().getFullYear()} Clean-Up Tracker. For a cleaner Las Piñas.</p>
    </footer>
  );
}


