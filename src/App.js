import React, { useState, useEffect } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  LogOut,
  Check,
  Clock,
  Plus,
  Download,
  Wifi,
  WifiOff,
} from "lucide-react";

import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  setDoc,
  getDoc,
  getDocs,
} from "firebase/firestore";
// Firebase configuration (you'll need to replace this with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyBU4OFoP-ae_XazISm1P5eiAnl0usDOKiA",
  authDomain: "team-vacation-app.firebaseapp.com",
  projectId: "team-vacation-app",
  storageBucket: "team-vacation-app.firebasestorage.app",
  messagingSenderId: "70843150534",
  appId: "1:70843150534:web:8aed9fc1a7a4c7f34b27c7",
  measurementId: "G-8ZK2RJLHYP",
};

console.log("App is loading!");

// Mock Firebase functions (in real app, these would be actual Firebase calls)
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const VacationPlannerApp = () => {
  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeView, setActiveView] = useState("calendar");
  const [calendarMode, setCalendarMode] = useState("month");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(null);
  const [selectedDateModal, setSelectedDateModal] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  // Firebase-related state
  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState("synced"); // 'syncing', 'synced', 'offline'

  // Data state
  const [teamMembers, setTeamMembers] = useState([
    {
      id: 1,
      name: "Jan Jansen",
      role: "Developer",
      avatar: "J",
      firebaseId: "user123",
    },
    {
      id: 2,
      name: "Emma de Vries",
      role: "Designer",
      avatar: "E",
      firebaseId: "user456",
    },
    {
      id: 3,
      name: "Lucas Bakker",
      role: "Project Manager",
      avatar: "L",
      firebaseId: "user789",
    },
    {
      id: 4,
      name: "Sophie Visser",
      role: "Marketing",
      avatar: "S",
      firebaseId: "user012",
    },
    {
      id: 5,
      name: "Tim Hendriks",
      role: "Developer",
      avatar: "T",
      firebaseId: "user345",
    },
  ]);

  const [vacations, setVacations] = useState([
    {
      id: 1,
      userId: 1,
      start: new Date(2025, 3, 5),
      end: new Date(2025, 3, 12),
      status: "approved",
      approvedBy: [2, 3, 4, 5],
      createdBy: "user123",
    },
    {
      id: 2,
      userId: 2,
      start: new Date(2025, 3, 15),
      end: new Date(2025, 3, 22),
      status: "pending",
      approvedBy: [1, 3],
      createdBy: "user456",
    },
    {
      id: 3,
      userId: 3,
      start: new Date(2025, 3, 25),
      end: new Date(2025, 3, 28),
      status: "created",
      approvedBy: [],
      createdBy: "user789",
    },
    {
      id: 4,
      userId: 4,
      start: new Date(2025, 4, 10),
      end: new Date(2025, 4, 15),
      status: "approved",
      approvedBy: [1, 2, 3, 5],
      createdBy: "user012",
    },
    {
      id: 5,
      userId: 5,
      start: new Date(2025, 4, 20),
      end: new Date(2025, 4, 27),
      status: "pending",
      approvedBy: [1, 2],
      createdBy: "user345",
    },
  ]);

  const [vacationForm, setVacationForm] = useState({
    startDate: "",
    endDate: "",
    notes: "",
  });

  const [currentUser, setCurrentUser] = useState(teamMembers[0]);

  // Nederlandse officiële feestdagen
  const dutchHolidays = [
    // 2025
    { date: new Date(2025, 0, 1), name: "Nieuwjaarsdag" },
    { date: new Date(2025, 3, 18), name: "Goede Vrijdag" },
    { date: new Date(2025, 3, 20), name: "Eerste Paasdag" },
    { date: new Date(2025, 3, 21), name: "Tweede Paasdag" },
    { date: new Date(2025, 3, 26), name: "Koningsdag" },
    { date: new Date(2025, 4, 5), name: "Bevrijdingsdag" },
    { date: new Date(2025, 4, 29), name: "Hemelvaartsdag" },
    { date: new Date(2025, 5, 8), name: "Eerste Pinksterdag" },
    { date: new Date(2025, 5, 9), name: "Tweede Pinksterdag" },
    { date: new Date(2025, 11, 25), name: "Eerste Kerstdag" },
    { date: new Date(2025, 11, 26), name: "Tweede Kerstdag" },

    // 2026-2027 (basic holidays - Easter dates need calculation)
    { date: new Date(2026, 0, 1), name: "Nieuwjaarsdag" },
    { date: new Date(2026, 3, 27), name: "Koningsdag" },
    { date: new Date(2026, 4, 5), name: "Bevrijdingsdag" },
    { date: new Date(2026, 11, 25), name: "Eerste Kerstdag" },
    { date: new Date(2026, 11, 26), name: "Tweede Kerstdag" },
    { date: new Date(2027, 0, 1), name: "Nieuwjaarsdag" },
    { date: new Date(2027, 3, 27), name: "Koningsdag" },
    { date: new Date(2027, 4, 5), name: "Bevrijdingsdag" },
    { date: new Date(2027, 11, 25), name: "Eerste Kerstdag" },
    { date: new Date(2027, 11, 26), name: "Tweede Kerstdag" },
  ];

  // Firebase initialization and auth
  // Firebase initialization and auth
useEffect(() => {
  // Create a fixed workspace ID that everyone shares
  const SHARED_WORKSPACE_ID = "team-vacation-workspace-2025";
  
  // Set a mock user object that represents the shared workspace
  setUser({ uid: SHARED_WORKSPACE_ID });
  
  // Load user preferences first
  loadUserPreferences().then(() => {
    // After preferences are loaded, check for saved current user
    const savedUserId = localStorage.getItem('currentUserId');
    if (savedUserId) {
      // IMPORTANT: We need to get the updated team member after preferences are loaded
      // Use a callback to get the latest state
      setTeamMembers(currentMembers => {
        const savedUser = currentMembers.find(m => m.id === parseInt(savedUserId));
        if (savedUser) {
          setCurrentUser(savedUser);
        } else {
          setCurrentUser(currentMembers[0]);
        }
        return currentMembers; // Return unchanged
      });
    } else {
      // No saved user, use the first team member
      setTeamMembers(currentMembers => {
        setCurrentUser(currentMembers[0]);
        return currentMembers;
      });
    }
  });
  
  console.log("Connected to shared workspace:", SHARED_WORKSPACE_ID);
}, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus("synced");
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

    // Real-time vacation updates
useEffect(() => {
  // Only set up the listener once we have our shared workspace
  if (!user) return;

  const SHARED_WORKSPACE_ID = "team-vacation-workspace-2025";
  
  // Connect to the shared workspace collection
  const unsubscribe = onSnapshot(
    collection(db, "workspaces", SHARED_WORKSPACE_ID, "vacations"),
    (snapshot) => {
      const vacationData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          start: new Date(data.start),
          end: new Date(data.end),
        };
      });
      setVacations(vacationData);
      setSyncStatus("synced");
    },
    (error) => {
      console.error("Error fetching vacations:", error);
      setSyncStatus("offline");
    }
  );

  return unsubscribe;
}, [user]);

  // Firestore helper functions
const saveVacationToFirestore = async (vacation) => {
  try {
    setSyncStatus("syncing");
    const SHARED_WORKSPACE_ID = "team-vacation-workspace-2025";
    
    const vacationData = {
      ...vacation,
      start: vacation.start.toISOString(),
      end: vacation.end.toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: vacation.userId, // Store the team member ID who created it
      userName: getUserName(vacation.userId), // Store the name for easy reference
    };

    if (vacation.id && typeof vacation.id === 'string' && !vacation.id.toString().match(/^\d+$/)) {
      // Update existing vacation (id is a Firestore document ID)
      await updateDoc(
        doc(db, "workspaces", SHARED_WORKSPACE_ID, "vacations", vacation.id),
        vacationData
      );
    } else {
      // Create new vacation
      await addDoc(
        collection(db, "workspaces", SHARED_WORKSPACE_ID, "vacations"),
        vacationData
      );
    }
    setSyncStatus("synced");
  } catch (error) {
    console.error("Error saving vacation:", error);
    setSyncStatus("offline");
  }
};

// Function to save user's name preference
const saveUserPreference = async (userId, userName) => {
  try {
    const SHARED_WORKSPACE_ID = "team-vacation-workspace-2025";
    
    // Store user preference in Firebase
    await setDoc(
      doc(db, "workspaces", SHARED_WORKSPACE_ID, "userPreferences", userId.toString()),
      {
        userId: userId,
        userName: userName,
        lastUpdated: new Date().toISOString()
      }
    );
    
    console.log("User preference saved:", userName);
  } catch (error) {
    console.error("Error saving user preference:", error);
  }
};

// Function to load all user preferences when app starts
const loadUserPreferences = async () => {
  try {
    const SHARED_WORKSPACE_ID = "team-vacation-workspace-2025";
    
    // Get all user preferences
    const prefsSnapshot = await getDocs(
      collection(db, "workspaces", SHARED_WORKSPACE_ID, "userPreferences")
    );
    
    const preferences = {};
    prefsSnapshot.forEach((doc) => {
      const data = doc.data();
      preferences[data.userId] = data.userName;
    });
    
    // Update team members with stored names
    setTeamMembers(prevMembers => 
      prevMembers.map(member => ({
        ...member,
        name: preferences[member.id] || member.name,
        avatar: (preferences[member.id] || member.name).charAt(0).toUpperCase()
      }))
    );
    
    console.log("User preferences loaded");
  } catch (error) {
    console.error("Error loading user preferences:", error);
  }
};  
  
  const updateTeamMemberInFirestore = async (member) => {
    try {
      setSyncStatus("syncing");
      await setDoc(doc(db, "teamMembers", member.firebaseId), member);
      setSyncStatus("synced");
    } catch (error) {
      console.error("Error updating team member:", error);
      setSyncStatus("offline");
    }
  };

  // Calendar generation functions
  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];

    const firstDay = new Date(year, month, 1).getDay();
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      days.push({ date: null, day: "empty" });
    }

    while (date.getMonth() === month) {
      days.push({ date: new Date(date), day: date.getDate() });
      date.setDate(date.getDate() + 1);
    }

    return days;
  };

  const days = getDaysInMonth(
    currentDate.getFullYear(),
    currentDate.getMonth()
  );

  const getMonthsInYear = (year) => {
    const months = [];
    for (let month = 0; month < 12; month++) {
      const monthDays = getDaysInMonth(year, month);
      months.push({
        month: month,
        name: new Date(year, month, 1).toLocaleDateString("nl-NL", {
          month: "long",
        }),
        days: monthDays,
      });
    }
    return months;
  };

  const months = getMonthsInYear(currentDate.getFullYear());

  // Vacation management functions
  const handleAddVacation = async () => {
    if (!vacationForm.startDate || !vacationForm.endDate) return;

    const newVacation = {
      id: Date.now(), // In real app, Firestore would generate this
      userId: currentUser.id,
      start: new Date(vacationForm.startDate),
      end: new Date(vacationForm.endDate),
      status: "created",
      approvedBy: [],
      notes: vacationForm.notes,
      createdBy: currentUser.id,
    };

    // Update local state immediately for responsive UI
    setVacations([...vacations, newVacation]);
    setVacationForm({ startDate: "", endDate: "", notes: "" });
    setActiveView("calendar");

    // Save to Firestore
    await saveVacationToFirestore(newVacation);
  };

const approveVacation = async (vacationId) => {
  const vacation = vacations.find(v => v.id === vacationId);
  if (!vacation) return;

  const alreadyApproved = vacation.approvedBy.includes(currentUser.id);
  
  if (!alreadyApproved) {
    const updatedApprovedBy = [...vacation.approvedBy, currentUser.id];
    const allTeamMembers = teamMembers
      .filter((m) => m.id !== vacation.userId)
      .map((m) => m.id);
    const allApproved = allTeamMembers.every((id) =>
      updatedApprovedBy.includes(id)
    );

    const updatedVacation = {
      ...vacation,
      approvedBy: updatedApprovedBy,
      status: allApproved ? "approved" : "pending",
    };

    // Update local state immediately for responsive UI
    setVacations(vacations.map(v => 
      v.id === vacationId ? updatedVacation : v
    ));

    // Save to Firestore
    await saveVacationToFirestore(updatedVacation);
  }
};

// Function to delete a vacation
const deleteVacation = async (vacationId) => {
  try {
    setSyncStatus("syncing");
    const SHARED_WORKSPACE_ID = "team-vacation-workspace-2025";
    
    // Remove from local state immediately for responsive UI
    setVacations(vacations.filter(v => v.id !== vacationId));
    
    // Delete from Firestore
    await deleteDoc(
      doc(db, "workspaces", SHARED_WORKSPACE_ID, "vacations", vacationId)
    );
    
    setSyncStatus("synced");
  } catch (error) {
    console.error("Error deleting vacation:", error);
    setSyncStatus("offline");
  }
};

  // Utility functions
  const getVacationStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "created":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getVacationsForDate = (date) => {
    if (!date) return [];

    return vacations.filter((vacation) => {
      const checkDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const startDate = new Date(
        vacation.start.getFullYear(),
        vacation.start.getMonth(),
        vacation.start.getDate()
      );
      const endDate = new Date(
        vacation.end.getFullYear(),
        vacation.end.getMonth(),
        vacation.end.getDate()
      );

      return checkDate >= startDate && checkDate <= endDate;
    });
  };

  const isHoliday = (date) => {
    if (!date) return false;
    return dutchHolidays.some(
      (holiday) =>
        holiday.date.getDate() === date.getDate() &&
        holiday.date.getMonth() === date.getMonth() &&
        holiday.date.getFullYear() === date.getFullYear()
    );
  };

  const getHolidayName = (date) => {
    if (!date) return null;
    const holiday = dutchHolidays.find(
      (holiday) =>
        holiday.date.getDate() === date.getDate() &&
        holiday.date.getMonth() === date.getMonth() &&
        holiday.date.getFullYear() === date.getFullYear()
    );
    return holiday ? holiday.name : null;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const formatMonthName = (date) => {
    return date.toLocaleDateString("nl-NL", { month: "long", year: "numeric" });
  };

  const getUserName = (userId) => {
    const user = teamMembers.find((member) => member.id === userId);
    return user ? user.name : "Onbekend";
  };

const updateUserName = async (newName) => {
  const updatedUser = {
    ...currentUser,
    name: newName,
    avatar: newName.charAt(0).toUpperCase(),
  };

  setTeamMembers(
    teamMembers.map((member) =>
      member.id === currentUser.id ? updatedUser : member
    )
  );
  setCurrentUser(updatedUser);
  
  // Save to localStorage for persistence across refreshes
  localStorage.setItem('currentUserId', currentUser.id.toString());

  // Save to Firebase using our new function
  await saveUserPreference(currentUser.id, newName);
  
  // Save to Firestore (keeping your existing function)
  await updateTeamMemberInFirestore(updatedUser);
};

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-3 md:p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2 md:space-x-4">
            <Calendar className="h-5 w-5 md:h-6 md:w-6" />
            <h1 className="text-lg md:text-xl font-semibold">
              Teamvakantie-planner
            </h1>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Sync status indicator */}
            <div className="flex items-center space-x-1">
              {isOnline ? (
                <Wifi
                  className={`h-4 w-4 ${
                    syncStatus === "synced"
                      ? "text-green-300"
                      : "text-yellow-300"
                  }`}
                />
              ) : (
                <WifiOff className="h-4 w-4 text-red-300" />
              )}
            </div>

            <button className="p-1.5 md:p-2 rounded-full hover:bg-blue-500 transition-colors">
              <Mail className="h-4 w-4 md:h-5 md:w-5" />
            </button>
            <div className="flex items-center space-x-2">
              <div
                className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-400 flex items-center justify-center text-sm font-bold shadow-sm cursor-pointer hover:bg-blue-300 transition-colors"
                onClick={() => setShowProfileModal(true)}
              >
                {currentUser.avatar}
              </div>
              <span className="hidden md:inline">{currentUser.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-2 md:px-4">
          <div className="flex justify-between">
            <div className="flex space-x-1 md:space-x-4">
              <button
                onClick={() => setActiveView("calendar")}
                className={`py-3 md:py-4 px-2 md:px-3 border-b-2 font-medium transition-colors text-sm md:text-base ${
                  activeView === "calendar"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent hover:border-blue-200 hover:text-blue-500"
                }`}
              >
                Kalender
              </button>
              <button
                onClick={() => setActiveView("team")}
                className={`py-3 md:py-4 px-2 md:px-3 border-b-2 font-medium transition-colors text-sm md:text-base ${
                  activeView === "team"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent hover:border-blue-200 hover:text-blue-500"
                }`}
              >
                Team
              </button>
            </div>
            <div className="py-2 md:py-3">
              <button
                onClick={() => setActiveView("addVacation")}
                className="bg-blue-600 text-white px-2 md:px-4 py-1.5 md:py-2 rounded-md flex items-center space-x-1 md:space-x-2 hover:bg-blue-700 transition-colors shadow-sm text-sm md:text-base"
              >
                <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="hidden xs:inline">Vakantie</span>
                <span className="hidden md:inline">Toevoegen</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-grow container mx-auto p-2 md:p-4 overflow-y-auto">
        {activeView === "calendar" && (
          <div className="bg-white rounded-lg shadow-md p-3 md:p-6">
            {/* Calendar header */}
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <button
                onClick={
                  calendarMode === "month"
                    ? goToPreviousMonth
                    : () =>
                        setCurrentDate(
                          new Date(currentDate.getFullYear() - 1, 0, 1)
                        )
                }
                className="p-1.5 md:p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </button>

              <div className="flex items-center space-x-2 md:space-x-4">
                <h2 className="text-lg md:text-2xl font-semibold text-gray-800">
                  {calendarMode === "month"
                    ? formatMonthName(currentDate)
                    : currentDate.getFullYear()}
                </h2>

                <div className="flex border border-gray-300 rounded-md overflow-hidden text-xs md:text-sm">
                  <button
                    onClick={() => setCalendarMode("month")}
                    className={`px-2 md:px-3 py-1 ${
                      calendarMode === "month"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Maand
                  </button>
                  <button
                    onClick={() => setCalendarMode("year")}
                    className={`px-2 md:px-3 py-1 ${
                      calendarMode === "year"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Jaar
                  </button>
                </div>
              </div>

              <button
                onClick={
                  calendarMode === "month"
                    ? goToNextMonth
                    : () =>
                        setCurrentDate(
                          new Date(currentDate.getFullYear() + 1, 0, 1)
                        )
                }
                className="p-1.5 md:p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </button>
            </div>

            {/* Month view */}
            {calendarMode === "month" && (
              <>
                <div className="grid grid-cols-7 gap-1 md:gap-2 mb-1 md:mb-2">
                  {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((day) => (
                    <div
                      key={day}
                      className="text-center font-semibold py-1 md:py-2 text-gray-500 border-b border-gray-200 text-xs md:text-sm"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 md:gap-2">
                  {days.map((day, index) => {
                    const dayVacations = day.date
                      ? getVacationsForDate(day.date)
                      : [];
                    const isToday =
                      day.date &&
                      new Date().toDateString() === day.date.toDateString();
                    const hasVacations = dayVacations.length > 0;
                    const holiday = day.date ? isHoliday(day.date) : false;

                    return (
                      <div
                        key={index}
                        className={`min-h-16 md:min-h-24 border rounded-lg p-1 md:p-2 transition-all ${
                          day.date ? "bg-white hover:shadow-sm" : "bg-gray-50"
                        } 
                          ${holiday ? "border-red-200 bg-red-50" : ""}
                          ${
                            isToday
                              ? "border-blue-500 border-2 shadow-sm"
                              : hasVacations
                              ? "border-gray-300"
                              : "border-gray-200"
                          }`}
                      >
                        {day.date && (
                          <>
                            <div
                              className={`text-right text-xs md:text-sm mb-1 md:mb-2 cursor-pointer font-medium ${
                                hasVacations || holiday
                                  ? "hover:text-blue-600"
                                  : ""
                              } 
                                ${
                                  isToday
                                    ? "text-blue-600"
                                    : holiday
                                    ? "text-red-600"
                                    : "text-gray-700"
                                }`}
                              onClick={() => {
                                if (dayVacations.length > 0 || holiday) {
                                  setSelectedDateModal({
                                    date: day.date,
                                    vacations: dayVacations,
                                  });
                                }
                              }}
                            >
                              {day.day}
                            </div>

                            {holiday && (
                              <div className="text-xxs md:text-xs text-red-600 font-medium mb-1 md:mb-1.5 bg-red-50 p-0.5 md:p-1 rounded text-center truncate">
                                {getHolidayName(day.date)}
                              </div>
                            )}

                            <div className="space-y-1 md:space-y-1.5">
                              {dayVacations.slice(0, 3).map((vacation, idx) => (
                                <div
                                  key={vacation.id}
                                  className={`text-xxs md:text-xs p-0.5 md:p-1.5 rounded-md text-white ${getVacationStatusColor(
                                    vacation.status
                                  )} shadow-sm hover:shadow-md transition-shadow cursor-pointer truncate`}
                                  onClick={() => setShowModal(vacation)}
                                >
                                  {getUserName(vacation.userId)}
                                </div>
                              ))}
                              {dayVacations.length > 3 && (
                                <div
                                  className="text-xxs md:text-xs p-0.5 md:p-1 text-center text-gray-600 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200"
                                  onClick={() =>
                                    setSelectedDateModal({
                                      date: day.date,
                                      vacations: dayVacations,
                                    })
                                  }
                                >
                                  +{dayVacations.length - 3} meer
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Year view */}
            {calendarMode === "year" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {months.map((monthData) => {
                  const monthVacationsCount = vacations.filter((vacation) => {
                    const vacationStartMonth = vacation.start.getMonth();
                    const vacationEndMonth = vacation.end.getMonth();
                    const vacationStartYear = vacation.start.getFullYear();
                    const vacationEndYear = vacation.end.getFullYear();
                    const currentYear = currentDate.getFullYear();

                    return (
                      (vacationStartYear === currentYear &&
                        vacationStartMonth === monthData.month) ||
                      (vacationEndYear === currentYear &&
                        vacationEndMonth === monthData.month) ||
                      (vacationStartYear === currentYear &&
                        vacationEndYear === currentYear &&
                        vacationStartMonth <= monthData.month &&
                        vacationEndMonth >= monthData.month)
                    );
                  }).length;

                  const monthHolidays = dutchHolidays.filter(
                    (holiday) =>
                      holiday.date.getMonth() === monthData.month &&
                      holiday.date.getFullYear() === currentDate.getFullYear()
                  );

                  const isCurrentMonth =
                    currentDate.getMonth() === monthData.month &&
                    currentDate.getFullYear() === new Date().getFullYear();

                  return (
                    <div
                      key={monthData.month}
                      className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer
                        ${
                          isCurrentMonth
                            ? "border-blue-400 shadow-sm"
                            : "border-gray-200"
                        }`}
                      onClick={() => {
                        setCurrentDate(
                          new Date(
                            currentDate.getFullYear(),
                            monthData.month,
                            1
                          )
                        );
                        setCalendarMode("month");
                      }}
                    >
                      <div
                        className={`p-1.5 md:p-2 text-center font-medium border-b text-sm ${
                          isCurrentMonth
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-50"
                        }`}
                      >
                        {monthData.name}
                      </div>

                      <div className="grid grid-cols-7 gap-px bg-gray-100">
                        {["M", "D", "W", "D", "V", "Z", "Z"].map((day, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-50 text-center text-xxs md:text-xs text-gray-500 p-0.5 md:p-1"
                          >
                            {day}
                          </div>
                        ))}

                        {monthData.days.map((day, dayIndex) => {
                          const holiday = day.date
                            ? isHoliday(day.date)
                            : false;
                          const hasVacation = day.date
                            ? getVacationsForDate(day.date).length > 0
                            : false;

                          return (
                            <div
                              key={dayIndex}
                              className={`w-full h-5 md:h-6 flex items-center justify-center text-xxs md:text-xs
                                ${!day.date ? "bg-gray-50" : "bg-white"}
                                ${
                                  holiday
                                    ? "bg-red-50 text-red-600 font-medium"
                                    : ""
                                }
                                ${hasVacation ? "font-bold" : ""}
                              `}
                            >
                              {day.date && (
                                <div className="relative">
                                  {day.day}
                                  {hasVacation && (
                                    <>
                                      {getVacationsForDate(day.date).map(
                                        (vacation, vIndex) => {
                                          const offset =
                                            vIndex * 4 -
                                            (getVacationsForDate(day.date)
                                              .length -
                                              1) *
                                              2;
                                          return (
                                            <div
                                              key={vIndex}
                                              className={`absolute -bottom-1 w-1 md:w-1.5 h-1 md:h-1.5 rounded-full ${getVacationStatusColor(
                                                vacation.status
                                              )}`}
                                              style={{
                                                left: `calc(50% + ${offset}px)`,
                                                transform: "translateX(-50%)",
                                              }}
                                            ></div>
                                          );
                                        }
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-1 md:p-2 bg-white border-t">
                        <div className="flex justify-between items-center text-xxs md:text-xs">
                          <div>
                            {monthVacationsCount > 0 && (
                              <span className="text-blue-600 font-medium">
                                {monthVacationsCount} vakantie(s)
                              </span>
                            )}
                          </div>
                          <div>
                            {monthHolidays.length > 0 && (
                              <span className="text-red-600 font-medium">
                                {monthHolidays.length} feestdag(en)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 md:mt-6 flex flex-wrap gap-2 md:gap-4 bg-gray-50 p-2 md:p-3 rounded-lg text-xs md:text-sm">
              <div className="flex items-center space-x-1 md:space-x-2">
                <div className="w-3 md:w-4 h-3 md:h-4 bg-green-500 rounded-full shadow-sm"></div>
                <span>Goedgekeurd</span>
              </div>
              <div className="flex items-center space-x-1 md:space-x-2">
                <div className="w-3 md:w-4 h-3 md:h-4 bg-yellow-500 rounded-full shadow-sm"></div>
                <span>In afwachting</span>
              </div>
              <div className="flex items-center space-x-1 md:space-x-2">
                <div className="w-3 md:w-4 h-3 md:h-4 bg-gray-500 rounded-full shadow-sm"></div>
                <span>Aangemaakt</span>
              </div>
              <div className="flex items-center space-x-1 md:space-x-2">
                <div className="w-3 md:w-4 h-3 md:h-4 bg-red-200 rounded-full shadow-sm"></div>
                <span>Feestdag</span>
              </div>
            </div>
          </div>
        )}

        {activeView === "team" && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-3 md:p-5 border-b border-gray-200">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                Team Overzicht
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {teamMembers.map((member) => {
                const memberVacations = vacations.filter(
                  (v) => v.userId === member.id
                );

                return (
                  <div
                    key={member.id}
                    className="p-3 md:p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 md:space-x-4 mb-3 md:mb-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-sm">
                        {member.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold text-base md:text-lg text-gray-800">
                          {member.name}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600">
                          {member.role}
                        </p>
                      </div>
                    </div>

                    {memberVacations.length === 0 ? (
                      <p className="text-xs md:text-sm text-gray-500 ml-2 italic">
                        Geen geplande vakanties
                      </p>
                    ) : (
                      <div className="space-y-2 md:space-y-3 ml-2">
                        {memberVacations.map((vacation) => {
                          const totalRequired = teamMembers.length - 1;
                          const approvalPercentage =
                            totalRequired > 0
                              ? Math.round(
                                  (vacation.approvedBy.length / totalRequired) *
                                    100
                                )
                              : 0;

                          return (
                            <div
                              key={vacation.id}
                              className="flex items-center border border-gray-200 rounded-lg p-2 md:p-3 hover:shadow-md transition-shadow cursor-pointer bg-white"
                              onClick={() => setShowApprovalModal(vacation)}
                            >
                              <div
                                className={`w-3 md:w-4 h-3 md:h-4 rounded-full ${getVacationStatusColor(
                                  vacation.status
                                )} mr-3 md:mr-4 shadow-sm`}
                              ></div>

                              <div className="flex-grow">
                                <p className="text-xs md:text-sm font-medium text-gray-800">
                                  {vacation.start.toLocaleDateString("nl-NL")}{" "}
                                  t/m {vacation.end.toLocaleDateString("nl-NL")}
                                </p>

                                <div className="flex items-center mt-1 md:mt-2">
                                  <div className="w-full bg-gray-100 rounded-full h-1.5 md:h-2.5 mr-2 md:mr-3 flex-grow shadow-inner">
                                    <div
                                      className={`h-1.5 md:h-2.5 rounded-full ${
                                        vacation.status === "approved"
                                          ? "bg-green-500"
                                          : vacation.status === "pending"
                                          ? "bg-yellow-500"
                                          : "bg-gray-500"
                                      }`}
                                      style={{
                                        width: `${approvalPercentage}%`,
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-xxs md:text-xs font-medium text-gray-600 whitespace-nowrap">
                                    {vacation.approvedBy.length}/{totalRequired}{" "}
                                    goedkeuringen
                                  </span>
                                </div>
                              </div>

                              <div
                                className="ml-2 md:ml-3 text-xxs md:text-xs px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full font-medium shadow-sm whitespace-nowrap"
                                style={{
                                  backgroundColor:
                                    vacation.status === "approved"
                                      ? "rgba(34, 197, 94, 0.1)"
                                      : vacation.status === "pending"
                                      ? "rgba(234, 179, 8, 0.1)"
                                      : "rgba(107, 114, 128, 0.1)",
                                  color:
                                    vacation.status === "approved"
                                      ? "rgb(21, 128, 61)"
                                      : vacation.status === "pending"
                                      ? "rgb(161, 98, 7)"
                                      : "rgb(55, 65, 81)",
                                }}
                              >
                                {vacation.status === "approved"
                                  ? "Goedgekeurd"
                                  : vacation.status === "pending"
                                  ? "In afwachting"
                                  : "Aangemaakt"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeView === "addVacation" && (
          <div className="bg-white rounded-lg shadow-md p-3 md:p-4">
            <div className="mb-3 md:mb-4 border-b pb-2">
              <h2 className="text-lg md:text-xl font-semibold">
                Nieuwe Vakantie Toevoegen
              </h2>
            </div>

            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Startdatum
                </label>
                <input
                  type="date"
                  value={vacationForm.startDate}
                  onChange={(e) =>
                    setVacationForm({
                      ...vacationForm,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Einddatum
                </label>
                <input
                  type="date"
                  value={vacationForm.endDate}
                  onChange={(e) =>
                    setVacationForm({
                      ...vacationForm,
                      endDate: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Opmerkingen
                </label>
                <textarea
                  value={vacationForm.notes}
                  onChange={(e) =>
                    setVacationForm({ ...vacationForm, notes: e.target.value })
                  }
                  className="w-full p-2 border rounded-md text-sm"
                  rows="3"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setActiveView("calendar")}
                  className="px-3 md:px-4 py-1.5 md:py-2 border rounded-md text-sm"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleAddVacation}
                  className="px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white rounded-md text-sm shadow-sm hover:bg-blue-700 transition-colors"
                >
                  Toevoegen
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white shadow p-3 md:p-4 mt-auto">
        <div className="container mx-auto flex flex-col xs:flex-row justify-between items-center">
          <p className="text-xs md:text-sm text-gray-600 mb-2 xs:mb-0">
            © 2025 Teamvakantie-planner
          </p>

          <div className="flex items-center space-x-2 text-xs md:text-sm">
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                syncStatus === "synced"
                  ? "bg-green-100 text-green-700"
                  : syncStatus === "syncing"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {syncStatus === "synced"
                ? "Gesynchroniseerd"
                : syncStatus === "syncing"
                ? "Synchroniseren..."
                : "Offline"}
            </span>
          </div>
        </div>
      </footer>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-3 md:p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-3 md:p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h2 className="text-base md:text-lg font-semibold text-gray-800">
                Profiel
              </h2>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setEditingName(false);
                  setNewName("");
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors rounded-full w-7 md:w-8 h-7 md:h-8 flex items-center justify-center hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            <div className="p-3 md:p-5">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold shadow-sm">
                  {currentUser.avatar}
                </div>
                <div className="flex-grow">
                  {editingName ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full p-2 border rounded-md text-sm"
                        placeholder="Nieuwe naam"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            updateUserName(newName);
                            setEditingName(false);
                            setNewName("");
                          }
                        }}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            updateUserName(newName);
                            setEditingName(false);
                            setNewName("");
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs"
                        >
                          Opslaan
                        </button>
                        <button
                          onClick={() => {
                            setEditingName(false);
                            setNewName("");
                          }}
                          className="px-3 py-1 border border-gray-300 rounded-md text-xs"
                        >
                          Annuleren
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-semibold text-lg">
                        {currentUser.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {currentUser.role}
                      </p>
                      <button
                        onClick={() => {
                          setEditingName(true);
                          setNewName(currentUser.name);
                        }}
                        className="text-blue-600 text-sm hover:underline mt-1"
                      >
                        Naam wijzigen
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 text-center">
                  Gebruik deze app om vakanties te plannen met je team
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other modals remain the same but I'll add them for completeness */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 md:p-4 z-20">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-3 md:p-4 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-base md:text-lg font-semibold">
                Vakantie Details
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 p-1 rounded-full hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <div className="p-3 md:p-4 space-y-2 md:space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-sm md:text-base">
                  Medewerker:
                </span>
                <span className="text-sm md:text-base">
                  {getUserName(showModal.userId)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-sm md:text-base">
                  Periode:
                </span>
                <span className="text-sm md:text-base">
                  {showModal.start.toLocaleDateString("nl-NL")} t/m{" "}
                  {showModal.end.toLocaleDateString("nl-NL")}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-sm md:text-base">
                  Status:
                </span>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2.5 md:w-3 h-2.5 md:h-3 rounded-full ${getVacationStatusColor(
                      showModal.status
                    )}`}
                  ></div>
                  <span className="text-sm md:text-base">
                    {showModal.status === "approved"
                      ? "Goedgekeurd"
                      : showModal.status === "pending"
                      ? "In afwachting"
                      : "Aangemaakt"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-sm md:text-base">
                  Goedgekeurd door:
                </span>
                <span className="text-sm md:text-base">
                  {showModal.approvedBy.length
                    ? `${showModal.approvedBy.length} teamleden`
                    : "Nog niemand"}
                </span>
              </div>

              {showModal.notes && (
                <div className="mt-2">
                  <span className="font-medium text-sm md:text-base">
                    Opmerkingen:
                  </span>
                  <p className="text-xs md:text-sm mt-1 text-gray-700">
                    {showModal.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 md:p-4 border-t flex justify-between sticky bottom-0 bg-white">
              {/* Delete button - only show for vacation creator */}
{showModal.userId === currentUser.id && (
  <button
    onClick={() => {
      setShowDeleteConfirm(showModal);
      setShowModal(false);
    }}
    className="flex items-center space-x-1 bg-red-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-md text-sm shadow-sm hover:bg-red-700 transition-colors"
  >
    <span>Verwijderen</span>
  </button>
)}

<div className="flex-grow"></div>
              {showModal.userId !== currentUser.id &&
                !showModal.approvedBy.includes(currentUser.id) &&
                showModal.status !== "approved" && (
                  <button
                    onClick={() => {
                      approveVacation(showModal.id);
                      setShowModal(false);
                    }}
                    className="flex items-center space-x-1 bg-green-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-md text-sm shadow-sm hover:bg-green-700 transition-colors"
                  >
                    <Check className="h-3.5 md:h-4 w-3.5 md:w-4" />
                    <span>Goedkeuren</span>
                  </button>
                )}

              {showModal.userId !== currentUser.id &&
                showModal.approvedBy.includes(currentUser.id) && (
                  <div className="text-green-600 flex items-center space-x-1 text-sm">
                    <Check className="h-3.5 md:h-4 w-3.5 md:w-4" />
                    <span>Je hebt deze vakantie al goedgekeurd</span>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Additional modals would go here... */}
    </div>
  );
};

export default VacationPlannerApp;
