"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUpcomingWeekClasses = exports.addClassToTimetable = exports.getTodayClasses = exports.subscribeCourseTimetable = exports.subscribeLecturerTimetable = exports.getDepartmentTimetable = exports.getCourseTimetable = exports.getLecturerTimetable = exports.ensureCollectionExists = exports.signInUser = exports.createNewUser = exports.validateEmailByRole = exports.checkClassRepExists = exports.getAdminCount = exports.isValidStudentEmail = exports.isValidLecturerEmail = exports.checkAdminRegistrationStatus = exports.checkCourseHasRep = exports.countUsersByRole = exports.checkEmailExists = exports.updateUserProfile = exports.resendVerificationEmail = exports.signOutUser = exports.getCurrentUser = exports.db = exports.auth = exports.app = void 0;

var _app = require("firebase/app");

var _auth = require("firebase/auth");

var _firestore = require("firebase/firestore");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyAwruoIL8WpN7AzgAmNTW8ZYcZZny1qZs0",
  authDomain: "tumcalendar-75b52.firebaseapp.com",
  projectId: "tumcalendar-75b52",
  storageBucket: "tumcalendar-75b52.appspot.com",
  messagingSenderId: "606128397684",
  appId: "1:606128397684:web:0fc57fde30a1cd2d1ee021",
  measurementId: "G-5C1KWE2HH6"
}; // Initialize Firebase

var app = (0, _app.initializeApp)(firebaseConfig);
exports.app = app;
var auth = (0, _auth.getAuth)(app);
exports.auth = auth;
var db = (0, _firestore.getFirestore)(app); // Set authentication persistence to session

exports.db = db;
(0, _auth.setPersistence)(auth, _auth.browserSessionPersistence)["catch"](function (error) {
  console.error("Firebase persistence error:", error);
}); // Check if Firestore users collection exists and create it if needed

var initializeFirestore = function initializeFirestore() {
  var testQuery;
  return regeneratorRuntime.async(function initializeFirestore$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          // Try to get a sample user document to check if collection exists
          testQuery = (0, _firestore.query)((0, _firestore.collection)(db, "users"), (0, _firestore.where)("role", "==", "admin"));
          _context.next = 4;
          return regeneratorRuntime.awrap((0, _firestore.getDocs)(testQuery));

        case 4:
          console.log("Firestore users collection is ready");
          return _context.abrupt("return", true);

        case 8:
          _context.prev = 8;
          _context.t0 = _context["catch"](0);
          console.log("Initializing Firestore connection:", _context.t0.message); // Don't treat this as an error since it might be first-time setup
          // or security rules not allowing unauthenticated queries

          return _context.abrupt("return", false);

        case 12:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 8]]);
}; // Initialize Firestore on app load


initializeFirestore(); // Check user authentication status and Firestore profile with enhanced error handling

var getCurrentUser = function getCurrentUser() {
  return new Promise(function (resolve, reject) {
    var unsubscribe = (0, _auth.onAuthStateChanged)(auth, function _callee(user) {
      var userDoc, userData, basicUserData;
      return regeneratorRuntime.async(function _callee$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              unsubscribe();

              if (!user) {
                _context2.next = 41;
                break;
              }

              _context2.prev = 2;
              _context2.next = 5;
              return regeneratorRuntime.awrap((0, _firestore.getDoc)((0, _firestore.doc)(db, "users", user.uid)));

            case 5:
              userDoc = _context2.sent;

              if (!userDoc.exists()) {
                _context2.next = 20;
                break;
              }

              // Combine auth user with Firestore data
              userData = userDoc.data();
              console.log("User data retrieved from Firestore:", userData); // Update last login timestamp

              _context2.prev = 9;
              _context2.next = 12;
              return regeneratorRuntime.awrap((0, _firestore.updateDoc)((0, _firestore.doc)(db, "users", user.uid), {
                lastLogin: new Date().toISOString()
              }));

            case 12:
              _context2.next = 17;
              break;

            case 14:
              _context2.prev = 14;
              _context2.t0 = _context2["catch"](9);
              console.warn("Could not update last login time:", _context2.t0);

            case 17:
              resolve(_objectSpread({}, user, {}, userData));
              _context2.next = 33;
              break;

            case 20:
              console.warn("User exists in Auth but not in Firestore. Creating Firestore record..."); // Auto-create missing user document in Firestore

              _context2.prev = 21;
              basicUserData = {
                email: user.email,
                role: "unknown",
                // Default role
                emailVerified: user.emailVerified,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                approved: false // Default to unapproved

              };
              _context2.next = 25;
              return regeneratorRuntime.awrap((0, _firestore.setDoc)((0, _firestore.doc)(db, "users", user.uid), basicUserData));

            case 25:
              console.log("Created missing user document in Firestore");
              resolve(_objectSpread({}, user, {}, basicUserData));
              _context2.next = 33;
              break;

            case 29:
              _context2.prev = 29;
              _context2.t1 = _context2["catch"](21);
              console.error("Failed to create missing user document:", _context2.t1);
              resolve(user);

            case 33:
              _context2.next = 39;
              break;

            case 35:
              _context2.prev = 35;
              _context2.t2 = _context2["catch"](2);
              console.error("Error getting user profile:", _context2.t2);
              resolve(user);

            case 39:
              _context2.next = 42;
              break;

            case 41:
              resolve(null);

            case 42:
            case "end":
              return _context2.stop();
          }
        }
      }, null, null, [[2, 35], [9, 14], [21, 29]]);
    }, reject);
  });
}; // Sign out user


exports.getCurrentUser = getCurrentUser;

var signOutUser = function signOutUser() {
  return regeneratorRuntime.async(function signOutUser$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return regeneratorRuntime.awrap((0, _auth.signOut)(auth));

        case 3:
          return _context3.abrupt("return", {
            success: true,
            message: "Logged out successfully"
          });

        case 6:
          _context3.prev = 6;
          _context3.t0 = _context3["catch"](0);
          console.error("Error signing out:", _context3.t0);
          return _context3.abrupt("return", {
            success: false,
            error: _context3.t0.message
          });

        case 10:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 6]]);
}; // Helper function to resend verification email


exports.signOutUser = signOutUser;

var resendVerificationEmail = function resendVerificationEmail(user) {
  return regeneratorRuntime.async(function resendVerificationEmail$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          if (!(user && !user.emailVerified)) {
            _context4.next = 2;
            break;
          }

          return _context4.abrupt("return", (0, _auth.sendEmailVerification)(user));

        case 2:
          throw new Error("User is already verified or not available");

        case 3:
        case "end":
          return _context4.stop();
      }
    }
  });
}; // Update user profile in Firestore with better error handling


exports.resendVerificationEmail = resendVerificationEmail;

var updateUserProfile = function updateUserProfile(userId, data) {
  var userRef, docSnap;
  return regeneratorRuntime.async(function updateUserProfile$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          userRef = (0, _firestore.doc)(db, "users", userId); // First check if the document exists

          _context5.next = 4;
          return regeneratorRuntime.awrap((0, _firestore.getDoc)(userRef));

        case 4:
          docSnap = _context5.sent;

          if (!docSnap.exists()) {
            _context5.next = 11;
            break;
          }

          _context5.next = 8;
          return regeneratorRuntime.awrap((0, _firestore.updateDoc)(userRef, _objectSpread({}, data, {
            updatedAt: new Date().toISOString()
          })));

        case 8:
          return _context5.abrupt("return", {
            success: true
          });

        case 11:
          _context5.next = 13;
          return regeneratorRuntime.awrap((0, _firestore.setDoc)(userRef, _objectSpread({}, data, {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })));

        case 13:
          return _context5.abrupt("return", {
            success: true
          });

        case 14:
          _context5.next = 20;
          break;

        case 16:
          _context5.prev = 16;
          _context5.t0 = _context5["catch"](0);
          console.error("Error updating user profile:", _context5.t0);
          return _context5.abrupt("return", {
            success: false,
            error: _context5.t0.message
          });

        case 20:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[0, 16]]);
}; // Check if email exists in the system with improved error handling


exports.updateUserProfile = updateUserProfile;

var checkEmailExists = function checkEmailExists(email) {
  var usersRef, q, querySnapshot;
  return regeneratorRuntime.async(function checkEmailExists$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          usersRef = (0, _firestore.collection)(db, "users");
          q = (0, _firestore.query)(usersRef, (0, _firestore.where)("email", "==", email));
          _context6.next = 5;
          return regeneratorRuntime.awrap((0, _firestore.getDocs)(q));

        case 5:
          querySnapshot = _context6.sent;
          return _context6.abrupt("return", !querySnapshot.empty);

        case 9:
          _context6.prev = 9;
          _context6.t0 = _context6["catch"](0);
          console.error("Error checking email:", _context6.t0); // Return false instead of throwing to prevent app crashes

          return _context6.abrupt("return", false);

        case 13:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[0, 9]]);
}; // Count users by role with improved error handling


exports.checkEmailExists = checkEmailExists;

var countUsersByRole = function countUsersByRole(role) {
  var usersRef, q, querySnapshot;
  return regeneratorRuntime.async(function countUsersByRole$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _context7.prev = 0;
          usersRef = (0, _firestore.collection)(db, "users");
          q = (0, _firestore.query)(usersRef, (0, _firestore.where)("role", "==", role));
          _context7.next = 5;
          return regeneratorRuntime.awrap((0, _firestore.getDocs)(q));

        case 5:
          querySnapshot = _context7.sent;
          return _context7.abrupt("return", querySnapshot.size);

        case 9:
          _context7.prev = 9;
          _context7.t0 = _context7["catch"](0);
          console.error("Error counting users by role:", _context7.t0); // Return 0 instead of throwing

          return _context7.abrupt("return", 0);

        case 13:
        case "end":
          return _context7.stop();
      }
    }
  }, null, null, [[0, 9]]);
}; // Check admin registration status - improved with better error handling


exports.countUsersByRole = countUsersByRole;

var checkAdminRegistrationStatus = function checkAdminRegistrationStatus(email) {
  var emailCheckQ, emailQuerySnapshot, adminQ, adminSnapshot, adminCount;
  return regeneratorRuntime.async(function checkAdminRegistrationStatus$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          // Check if this specific email is already registered
          emailCheckQ = (0, _firestore.query)((0, _firestore.collection)(db, "users"), (0, _firestore.where)("email", "==", email));
          _context8.next = 4;
          return regeneratorRuntime.awrap((0, _firestore.getDocs)(emailCheckQ));

        case 4:
          emailQuerySnapshot = _context8.sent;

          if (emailQuerySnapshot.empty) {
            _context8.next = 7;
            break;
          }

          return _context8.abrupt("return", {
            canRegister: false,
            message: "This email address is already registered in the system"
          });

        case 7:
          // Get all admin users
          adminQ = (0, _firestore.query)((0, _firestore.collection)(db, "users"), (0, _firestore.where)("role", "==", "admin"));
          _context8.next = 10;
          return regeneratorRuntime.awrap((0, _firestore.getDocs)(adminQ));

        case 10:
          adminSnapshot = _context8.sent;
          adminCount = adminSnapshot.size; // If we have fewer than 2 admins, allow registration

          if (!(adminCount < 2)) {
            _context8.next = 14;
            break;
          }

          return _context8.abrupt("return", {
            canRegister: true,
            message: ""
          });

        case 14:
          return _context8.abrupt("return", {
            canRegister: false,
            message: "Maximum number of administrators (2) has been reached. Please contact system support."
          });

        case 17:
          _context8.prev = 17;
          _context8.t0 = _context8["catch"](0);
          console.error("Error checking admin registration status:", _context8.t0); // In case of error, allow registration and handle in next steps

          return _context8.abrupt("return", {
            canRegister: true,
            message: "Could not verify administrator limits. Proceeding with registration."
          });

        case 21:
        case "end":
          return _context8.stop();
      }
    }
  }, null, null, [[0, 17]]);
}; // Check if course has a class rep


exports.checkAdminRegistrationStatus = checkAdminRegistrationStatus;

var checkCourseHasRep = function checkCourseHasRep(course) {
  var usersRef, q, querySnapshot;
  return regeneratorRuntime.async(function checkCourseHasRep$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          usersRef = (0, _firestore.collection)(db, "users");
          q = (0, _firestore.query)(usersRef, (0, _firestore.where)("role", "==", "class_rep"), (0, _firestore.where)("course", "==", course));
          _context9.next = 5;
          return regeneratorRuntime.awrap((0, _firestore.getDocs)(q));

        case 5:
          querySnapshot = _context9.sent;
          return _context9.abrupt("return", !querySnapshot.empty);

        case 9:
          _context9.prev = 9;
          _context9.t0 = _context9["catch"](0);
          console.error("Error checking course rep:", _context9.t0); // Return false instead of throwing

          return _context9.abrupt("return", false);

        case 13:
        case "end":
          return _context9.stop();
      }
    }
  }, null, null, [[0, 9]]);
}; // Email validation functions


exports.checkCourseHasRep = checkCourseHasRep;

var isValidLecturerEmail = function isValidLecturerEmail(email) {
  return email.endsWith('@tum.ac.ke') && !email.includes('@students.tum.ac.ke');
};

exports.isValidLecturerEmail = isValidLecturerEmail;

var isValidStudentEmail = function isValidStudentEmail(email, course) {
  if (!course) return false; // Match format: COURSECODE/NUMBER/YEAR@students.tum.ac.ke

  var studentEmailRegex = new RegExp("^".concat(course, "\\/[0-9]+[A-Z]?\\/[0-9]{4}@students\\.tum\\.ac\\.ke$"), 'i');
  return studentEmailRegex.test(email);
}; // Check admin count with improved error handling


exports.isValidStudentEmail = isValidStudentEmail;

var getAdminCount = function getAdminCount() {
  var adminQuery, adminSnapshot;
  return regeneratorRuntime.async(function getAdminCount$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          _context10.prev = 0;
          adminQuery = (0, _firestore.query)((0, _firestore.collection)(db, "users"), (0, _firestore.where)("role", "==", "admin"));
          _context10.next = 4;
          return regeneratorRuntime.awrap((0, _firestore.getDocs)(adminQuery));

        case 4:
          adminSnapshot = _context10.sent;
          return _context10.abrupt("return", adminSnapshot.size);

        case 8:
          _context10.prev = 8;
          _context10.t0 = _context10["catch"](0);
          console.error("Error checking admin count:", _context10.t0);
          return _context10.abrupt("return", 0);

        case 12:
        case "end":
          return _context10.stop();
      }
    }
  }, null, null, [[0, 8]]);
}; // Check if class rep exists for a specific course


exports.getAdminCount = getAdminCount;

var checkClassRepExists = function checkClassRepExists(course) {
  var classRepQuery, classRepSnapshot;
  return regeneratorRuntime.async(function checkClassRepExists$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          _context11.prev = 0;
          classRepQuery = (0, _firestore.query)((0, _firestore.collection)(db, "users"), (0, _firestore.where)("role", "==", "class_rep"), (0, _firestore.where)("course", "==", course));
          _context11.next = 4;
          return regeneratorRuntime.awrap((0, _firestore.getDocs)(classRepQuery));

        case 4:
          classRepSnapshot = _context11.sent;
          return _context11.abrupt("return", classRepSnapshot.size > 0);

        case 8:
          _context11.prev = 8;
          _context11.t0 = _context11["catch"](0);
          console.error("Error checking class rep:", _context11.t0);
          return _context11.abrupt("return", false);

        case 12:
        case "end":
          return _context11.stop();
      }
    }
  }, null, null, [[0, 8]]);
}; // Validate email format based on role


exports.checkClassRepExists = checkClassRepExists;

var validateEmailByRole = function validateEmailByRole(email, role, department, course) {
  var adminCount, lecturerPattern, classRepExists, classRepPattern;
  return regeneratorRuntime.async(function validateEmailByRole$(_context12) {
    while (1) {
      switch (_context12.prev = _context12.next) {
        case 0:
          _context12.prev = 0;

          if (!(!email || !role)) {
            _context12.next = 3;
            break;
          }

          return _context12.abrupt("return", {
            valid: false,
            error: "Email and role are required"
          });

        case 3:
          _context12.next = 5;
          return regeneratorRuntime.awrap(getAdminCount());

        case 5:
          adminCount = _context12.sent;
          _context12.t0 = role;
          _context12.next = _context12.t0 === 'admin' ? 9 : _context12.t0 === 'lecturer' ? 12 : _context12.t0 === 'class_rep' ? 18 : 31;
          break;

        case 9:
          if (!(adminCount >= 2)) {
            _context12.next = 11;
            break;
          }

          return _context12.abrupt("return", {
            valid: false,
            error: "Maximum number of administrators (2) already registered"
          });

        case 11:
          return _context12.abrupt("return", {
            valid: true,
            error: ""
          });

        case 12:
          // Lecturer validation - must have university email
          lecturerPattern = /^[a-zA-Z0-9._%+-]+@tum\.ac\.ke$/;

          if (!lecturerPattern.test(email)) {
            _context12.next = 17;
            break;
          }

          return _context12.abrupt("return", {
            valid: true,
            error: ""
          });

        case 17:
          return _context12.abrupt("return", {
            valid: false,
            error: "Lecturer email must be a valid university email (e.g., janedoe@tum.ac.ke)"
          });

        case 18:
          if (!(!department || !course)) {
            _context12.next = 20;
            break;
          }

          return _context12.abrupt("return", {
            valid: false,
            error: "Please select both department and course first"
          });

        case 20:
          _context12.next = 22;
          return regeneratorRuntime.awrap(checkClassRepExists(course));

        case 22:
          classRepExists = _context12.sent;

          if (!classRepExists) {
            _context12.next = 25;
            break;
          }

          return _context12.abrupt("return", {
            valid: false,
            error: "A class representative for ".concat(course, " already exists")
          });

        case 25:
          // Check email format: COURSECODE/NUMBER/YEAR@students.tum.ac.ke
          classRepPattern = new RegExp("^".concat(course, "\\/[0-9]+[A-Z]?\\/[0-9]{4}@students\\.tum\\.ac\\.ke$"), 'i');

          if (!classRepPattern.test(email)) {
            _context12.next = 30;
            break;
          }

          return _context12.abrupt("return", {
            valid: true,
            error: ""
          });

        case 30:
          return _context12.abrupt("return", {
            valid: false,
            error: "Class rep email must follow the format: ".concat(course, "/STUDENTNUMBER/YEAR@students.tum.ac.ke")
          });

        case 31:
          return _context12.abrupt("return", {
            valid: false,
            error: "Invalid role selected"
          });

        case 32:
          _context12.next = 38;
          break;

        case 34:
          _context12.prev = 34;
          _context12.t1 = _context12["catch"](0);
          console.error("Error validating email:", _context12.t1);
          return _context12.abrupt("return", {
            valid: false,
            error: "Error validating email. Please try again."
          });

        case 38:
        case "end":
          return _context12.stop();
      }
    }
  }, null, null, [[0, 34]]);
}; // Create new user account with improved error handling and Firestore integration


exports.validateEmailByRole = validateEmailByRole;

var createNewUser = function createNewUser(email, password, role, department, course) {
  var emailExists, adminStatus, userCredential, userData, errorMessage;
  return regeneratorRuntime.async(function createNewUser$(_context13) {
    while (1) {
      switch (_context13.prev = _context13.next) {
        case 0:
          _context13.prev = 0;
          _context13.next = 3;
          return regeneratorRuntime.awrap(checkEmailExists(email));

        case 3:
          emailExists = _context13.sent;

          if (!emailExists) {
            _context13.next = 6;
            break;
          }

          return _context13.abrupt("return", {
            success: false,
            message: "This email is already registered. Please use a different email or login."
          });

        case 6:
          if (!(role === 'admin')) {
            _context13.next = 12;
            break;
          }

          _context13.next = 9;
          return regeneratorRuntime.awrap(checkAdminRegistrationStatus(email));

        case 9:
          adminStatus = _context13.sent;

          if (adminStatus.canRegister) {
            _context13.next = 12;
            break;
          }

          return _context13.abrupt("return", {
            success: false,
            message: adminStatus.message
          });

        case 12:
          _context13.next = 14;
          return regeneratorRuntime.awrap((0, _auth.createUserWithEmailAndPassword)(auth, email, password));

        case 14:
          userCredential = _context13.sent;
          console.log("User created in Authentication:", userCredential.user.uid); // Prepare user data for Firestore

          userData = _objectSpread({
            email: userCredential.user.email,
            role: role,
            emailVerified: userCredential.user.emailVerified,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            approved: role === 'admin'
          }, role === 'class_rep' && {
            department: department,
            course: course
          }, {}, role === 'lecturer' && {
            department: department
          }); // Save user data to Firestore

          _context13.next = 19;
          return regeneratorRuntime.awrap((0, _firestore.setDoc)((0, _firestore.doc)(db, "users", userCredential.user.uid), userData));

        case 19:
          console.log("User data saved to Firestore");
          return _context13.abrupt("return", {
            success: true,
            message: role === 'admin' ? "Admin account created successfully! You may now log in." : "Account created! Awaiting admin approval. You'll be notified once approved.",
            user: userCredential.user
          });

        case 23:
          _context13.prev = 23;
          _context13.t0 = _context13["catch"](0);
          console.error("Error creating new user:", _context13.t0);
          errorMessage = _context13.t0.message;

          if (_context13.t0.code === 'auth/email-already-in-use') {
            errorMessage = "This email is already registered. Please use a different email or login.";
          } else if (_context13.t0.code === 'auth/invalid-email') {
            errorMessage = "Invalid email format. Please check and try again.";
          } else if (_context13.t0.code === 'auth/weak-password') {
            errorMessage = "Password is too weak. Please use a stronger password.";
          }

          return _context13.abrupt("return", {
            success: false,
            message: errorMessage,
            error: _context13.t0
          });

        case 29:
        case "end":
          return _context13.stop();
      }
    }
  }, null, null, [[0, 23]]);
}; // New function to sign in users with enhanced error handling


exports.createNewUser = createNewUser;

var signInUser = function signInUser(email, password) {
  var userCredential, userDoc, basicProfile, userData, errorMessage;
  return regeneratorRuntime.async(function signInUser$(_context14) {
    while (1) {
      switch (_context14.prev = _context14.next) {
        case 0:
          _context14.prev = 0;
          _context14.next = 3;
          return regeneratorRuntime.awrap((0, _auth.signInWithEmailAndPassword)(auth, email, password));

        case 3:
          userCredential = _context14.sent;
          console.log("User authenticated successfully:", userCredential.user.uid); // Get the user's Firestore profile

          _context14.next = 7;
          return regeneratorRuntime.awrap((0, _firestore.getDoc)((0, _firestore.doc)(db, "users", userCredential.user.uid)));

        case 7:
          userDoc = _context14.sent;

          if (userDoc.exists()) {
            _context14.next = 14;
            break;
          }

          console.warn("User not found in Firestore. Creating profile..."); // Create a basic profile if it doesn't exist

          basicProfile = {
            email: userCredential.user.email,
            emailVerified: userCredential.user.emailVerified,
            role: "unknown",
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            approved: false
          };
          _context14.next = 13;
          return regeneratorRuntime.awrap((0, _firestore.setDoc)((0, _firestore.doc)(db, "users", userCredential.user.uid), basicProfile));

        case 13:
          return _context14.abrupt("return", {
            success: true,
            message: "Logged in successfully, but profile is incomplete. Please contact an administrator.",
            user: _objectSpread({}, userCredential.user, {}, basicProfile)
          });

        case 14:
          // Get the user data
          userData = userDoc.data(); // Update last login timestamp

          _context14.next = 17;
          return regeneratorRuntime.awrap((0, _firestore.updateDoc)((0, _firestore.doc)(db, "users", userCredential.user.uid), {
            lastLogin: new Date().toISOString()
          }));

        case 17:
          if (!(!userData.approved && userData.role !== 'admin')) {
            _context14.next = 19;
            break;
          }

          return _context14.abrupt("return", {
            success: false,
            message: "Your account is pending approval. Please check back later or contact an administrator.",
            user: null
          });

        case 19:
          return _context14.abrupt("return", {
            success: true,
            message: "Logged in successfully!",
            user: _objectSpread({}, userCredential.user, {}, userData)
          });

        case 22:
          _context14.prev = 22;
          _context14.t0 = _context14["catch"](0);
          console.error("Login error:", _context14.t0);
          _context14.t1 = _context14.t0.code;
          _context14.next = _context14.t1 === 'auth/user-not-found' ? 28 : _context14.t1 === 'auth/wrong-password' ? 28 : _context14.t1 === 'auth/too-many-requests' ? 30 : _context14.t1 === 'auth/user-disabled' ? 32 : 34;
          break;

        case 28:
          errorMessage = "Invalid email or password. Please try again.";
          return _context14.abrupt("break", 35);

        case 30:
          errorMessage = "Too many unsuccessful login attempts. Please try again later or reset your password.";
          return _context14.abrupt("break", 35);

        case 32:
          errorMessage = "This account has been disabled. Please contact an administrator.";
          return _context14.abrupt("break", 35);

        case 34:
          errorMessage = "Failed to login. Please try again.";

        case 35:
          return _context14.abrupt("return", {
            success: false,
            message: errorMessage,
            error: _context14.t0
          });

        case 36:
        case "end":
          return _context14.stop();
      }
    }
  }, null, null, [[0, 22]]);
}; // Create a collection if it doesn't exist


exports.signInUser = signInUser;

var ensureCollectionExists = function ensureCollectionExists(collectionName) {
  var docRef;
  return regeneratorRuntime.async(function ensureCollectionExists$(_context15) {
    while (1) {
      switch (_context15.prev = _context15.next) {
        case 0:
          _context15.prev = 0;
          // Add a dummy document and then delete it to ensure collection exists
          docRef = (0, _firestore.doc)((0, _firestore.collection)(db, collectionName), 'dummy');
          _context15.next = 4;
          return regeneratorRuntime.awrap((0, _firestore.setDoc)(docRef, {
            dummy: true
          }));

        case 4:
          return _context15.abrupt("return", true);

        case 7:
          _context15.prev = 7;
          _context15.t0 = _context15["catch"](0);
          console.error("Error ensuring ".concat(collectionName, " collection exists:"), _context15.t0);
          return _context15.abrupt("return", false);

        case 11:
        case "end":
          return _context15.stop();
      }
    }
  }, null, null, [[0, 7]]);
}; // NEW FUNCTIONS FOR DASHBOARD DATA SHARING BETWEEN ROLES
// Get timetable entries for a lecturer based on their email


exports.ensureCollectionExists = ensureCollectionExists;

var getLecturerTimetable = function getLecturerTimetable(lecturerEmail) {
  var timetableRef, q, querySnapshot, classes;
  return regeneratorRuntime.async(function getLecturerTimetable$(_context16) {
    while (1) {
      switch (_context16.prev = _context16.next) {
        case 0:
          _context16.prev = 0;

          if (lecturerEmail) {
            _context16.next = 4;
            break;
          }

          console.error("Lecturer email is required");
          return _context16.abrupt("return", []);

        case 4:
          timetableRef = (0, _firestore.collection)(db, "timetable");
          q = (0, _firestore.query)(timetableRef, (0, _firestore.where)("lecturerEmail", "==", lecturerEmail));
          _context16.next = 8;
          return regeneratorRuntime.awrap((0, _firestore.getDocs)(q));

        case 8:
          querySnapshot = _context16.sent;
          classes = [];
          querySnapshot.forEach(function (doc) {
            classes.push(_objectSpread({
              id: doc.id
            }, doc.data()));
          });
          return _context16.abrupt("return", classes);

        case 14:
          _context16.prev = 14;
          _context16.t0 = _context16["catch"](0);
          console.error("Error fetching lecturer timetable:", _context16.t0);
          return _context16.abrupt("return", []);

        case 18:
        case "end":
          return _context16.stop();
      }
    }
  }, null, null, [[0, 14]]);
}; // Get timetable entries for a course


exports.getLecturerTimetable = getLecturerTimetable;

var getCourseTimetable = function getCourseTimetable(course) {
  var timetableRef, q, querySnapshot, classes;
  return regeneratorRuntime.async(function getCourseTimetable$(_context17) {
    while (1) {
      switch (_context17.prev = _context17.next) {
        case 0:
          _context17.prev = 0;

          if (course) {
            _context17.next = 4;
            break;
          }

          console.error("Course code is required");
          return _context17.abrupt("return", []);

        case 4:
          timetableRef = (0, _firestore.collection)(db, "timetable");
          q = (0, _firestore.query)(timetableRef, (0, _firestore.where)("course", "==", course));
          _context17.next = 8;
          return regeneratorRuntime.awrap((0, _firestore.getDocs)(q));

        case 8:
          querySnapshot = _context17.sent;
          classes = [];
          querySnapshot.forEach(function (doc) {
            classes.push(_objectSpread({
              id: doc.id
            }, doc.data()));
          });
          return _context17.abrupt("return", classes);

        case 14:
          _context17.prev = 14;
          _context17.t0 = _context17["catch"](0);
          console.error("Error fetching course timetable:", _context17.t0);
          return _context17.abrupt("return", []);

        case 18:
        case "end":
          return _context17.stop();
      }
    }
  }, null, null, [[0, 14]]);
}; // Get timetable entries for a department


exports.getCourseTimetable = getCourseTimetable;

var getDepartmentTimetable = function getDepartmentTimetable(department) {
  var timetableRef, q, querySnapshot, classes;
  return regeneratorRuntime.async(function getDepartmentTimetable$(_context18) {
    while (1) {
      switch (_context18.prev = _context18.next) {
        case 0:
          _context18.prev = 0;

          if (department) {
            _context18.next = 4;
            break;
          }

          console.error("Department is required");
          return _context18.abrupt("return", []);

        case 4:
          timetableRef = (0, _firestore.collection)(db, "timetable");
          q = (0, _firestore.query)(timetableRef, (0, _firestore.where)("department", "==", department));
          _context18.next = 8;
          return regeneratorRuntime.awrap((0, _firestore.getDocs)(q));

        case 8:
          querySnapshot = _context18.sent;
          classes = [];
          querySnapshot.forEach(function (doc) {
            classes.push(_objectSpread({
              id: doc.id
            }, doc.data()));
          });
          return _context18.abrupt("return", classes);

        case 14:
          _context18.prev = 14;
          _context18.t0 = _context18["catch"](0);
          console.error("Error fetching department timetable:", _context18.t0);
          return _context18.abrupt("return", []);

        case 18:
        case "end":
          return _context18.stop();
      }
    }
  }, null, null, [[0, 14]]);
}; // Subscribe to timetable updates for a lecturer


exports.getDepartmentTimetable = getDepartmentTimetable;

var subscribeLecturerTimetable = function subscribeLecturerTimetable(lecturerEmail, callback) {
  if (!lecturerEmail) {
    console.error("Lecturer email is required");
    return function () {};
  }

  var timetableRef = (0, _firestore.collection)(db, "timetable");
  var q = (0, _firestore.query)(timetableRef, (0, _firestore.where)("lecturerEmail", "==", lecturerEmail));
  return (0, _firestore.onSnapshot)(q, function (querySnapshot) {
    var classes = [];
    querySnapshot.forEach(function (doc) {
      classes.push(_objectSpread({
        id: doc.id
      }, doc.data()));
    });
    callback(classes);
  }, function (error) {
    console.error("Error subscribing to lecturer timetable:", error);
    callback([]);
  });
}; // Subscribe to timetable updates for a course


exports.subscribeLecturerTimetable = subscribeLecturerTimetable;

var subscribeCourseTimetable = function subscribeCourseTimetable(course, callback) {
  if (!course) {
    console.error("Course code is required");
    return function () {};
  }

  var timetableRef = (0, _firestore.collection)(db, "timetable");
  var q = (0, _firestore.query)(timetableRef, (0, _firestore.where)("course", "==", course));
  return (0, _firestore.onSnapshot)(q, function (querySnapshot) {
    var classes = [];
    querySnapshot.forEach(function (doc) {
      classes.push(_objectSpread({
        id: doc.id
      }, doc.data()));
    });
    callback(classes);
  }, function (error) {
    console.error("Error subscribing to course timetable:", error);
    callback([]);
  });
}; // Get classes for today for any user type


exports.subscribeCourseTimetable = subscribeCourseTimetable;

var getTodayClasses = function getTodayClasses(userType, userIdentifier) {
  var today, startOfDay, endOfDay, q, timetableRef, querySnapshot, classes;
  return regeneratorRuntime.async(function getTodayClasses$(_context19) {
    while (1) {
      switch (_context19.prev = _context19.next) {
        case 0:
          _context19.prev = 0;

          if (!(!userType || !userIdentifier)) {
            _context19.next = 4;
            break;
          }

          console.error("User type and identifier are required");
          return _context19.abrupt("return", []);

        case 4:
          today = new Date();
          startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
          endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
          timetableRef = (0, _firestore.collection)(db, "timetable");
          _context19.t0 = userType;
          _context19.next = _context19.t0 === 'lecturer' ? 11 : _context19.t0 === 'class_rep' ? 13 : _context19.t0 === 'admin' ? 15 : 17;
          break;

        case 11:
          // For lecturers, filter by their email
          q = (0, _firestore.query)(timetableRef, (0, _firestore.where)("lecturerEmail", "==", userIdentifier), (0, _firestore.where)("date", ">=", startOfDay), (0, _firestore.where)("date", "<=", endOfDay));
          return _context19.abrupt("break", 18);

        case 13:
          // For class reps, filter by course
          q = (0, _firestore.query)(timetableRef, (0, _firestore.where)("course", "==", userIdentifier), (0, _firestore.where)("date", ">=", startOfDay), (0, _firestore.where)("date", "<=", endOfDay));
          return _context19.abrupt("break", 18);

        case 15:
          // Admins can see all classes for today
          q = (0, _firestore.query)(timetableRef, (0, _firestore.where)("date", ">=", startOfDay), (0, _firestore.where)("date", "<=", endOfDay));
          return _context19.abrupt("break", 18);

        case 17:
          return _context19.abrupt("return", []);

        case 18:
          _context19.next = 20;
          return regeneratorRuntime.awrap((0, _firestore.getDocs)(q));

        case 20:
          querySnapshot = _context19.sent;
          classes = [];
          querySnapshot.forEach(function (doc) {
            classes.push(_objectSpread({
              id: doc.id
            }, doc.data()));
          });
          return _context19.abrupt("return", classes);

        case 26:
          _context19.prev = 26;
          _context19.t1 = _context19["catch"](0);
          console.error("Error fetching today's classes:", _context19.t1);
          return _context19.abrupt("return", []);

        case 30:
        case "end":
          return _context19.stop();
      }
    }
  }, null, null, [[0, 26]]);
}; // Add a new class to the timetable


exports.getTodayClasses = getTodayClasses;

var addClassToTimetable = function addClassToTimetable(classData) {
  var requiredFields, _i, _requiredFields, field, finalClassData, timetableRef, docRef;

  return regeneratorRuntime.async(function addClassToTimetable$(_context20) {
    while (1) {
      switch (_context20.prev = _context20.next) {
        case 0:
          _context20.prev = 0;

          if (classData) {
            _context20.next = 3;
            break;
          }

          return _context20.abrupt("return", {
            success: false,
            message: "Class data is required"
          });

        case 3:
          // Ensure required fields are present
          requiredFields = ["course", "lecturerEmail", "date", "startTime", "endTime", "room"];
          _i = 0, _requiredFields = requiredFields;

        case 5:
          if (!(_i < _requiredFields.length)) {
            _context20.next = 12;
            break;
          }

          field = _requiredFields[_i];

          if (classData[field]) {
            _context20.next = 9;
            break;
          }

          return _context20.abrupt("return", {
            success: false,
            message: "".concat(field, " is required")
          });

        case 9:
          _i++;
          _context20.next = 5;
          break;

        case 12:
          // Add additional metadata
          finalClassData = _objectSpread({}, classData, {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }); // Add to Firestore

          timetableRef = (0, _firestore.collection)(db, "timetable");
          _context20.next = 16;
          return regeneratorRuntime.awrap((0, _firestore.setDoc)((0, _firestore.doc)(timetableRef), finalClassData));

        case 16:
          docRef = _context20.sent;
          return _context20.abrupt("return", {
            success: true,
            message: "Class added successfully",
            id: docRef.id
          });

        case 20:
          _context20.prev = 20;
          _context20.t0 = _context20["catch"](0);
          console.error("Error adding class to timetable:", _context20.t0);
          return _context20.abrupt("return", {
            success: false,
            message: _context20.t0.message
          });

        case 24:
        case "end":
          return _context20.stop();
      }
    }
  }, null, null, [[0, 20]]);
}; // Get all classes for the upcoming week


exports.addClassToTimetable = addClassToTimetable;

var getUpcomingWeekClasses = function getUpcomingWeekClasses(userType, userIdentifier) {
  var today, startOfDay, endOfWeek, endOfWeekString, q, timetableRef, querySnapshot, classes;
  return regeneratorRuntime.async(function getUpcomingWeekClasses$(_context21) {
    while (1) {
      switch (_context21.prev = _context21.next) {
        case 0:
          _context21.prev = 0;

          if (!(!userType || !userIdentifier)) {
            _context21.next = 4;
            break;
          }

          console.error("User type and identifier are required");
          return _context21.abrupt("return", []);

        case 4:
          today = new Date();
          startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
          endOfWeek = new Date(today);
          endOfWeek.setDate(endOfWeek.getDate() + 7);
          endOfWeekString = new Date(endOfWeek.setHours(23, 59, 59, 999)).toISOString();
          timetableRef = (0, _firestore.collection)(db, "timetable");
          _context21.t0 = userType;
          _context21.next = _context21.t0 === 'lecturer' ? 13 : _context21.t0 === 'class_rep' ? 15 : _context21.t0 === 'admin' ? 17 : 19;
          break;

        case 13:
          // For lecturers, filter by their email
          q = (0, _firestore.query)(timetableRef, (0, _firestore.where)("lecturerEmail", "==", userIdentifier), (0, _firestore.where)("date", ">=", startOfDay), (0, _firestore.where)("date", "<=", endOfWeekString));
          return _context21.abrupt("break", 20);

        case 15:
          // For class reps, filter by course
          q = (0, _firestore.query)(timetableRef, (0, _firestore.where)("course", "==", userIdentifier), (0, _firestore.where)("date", ">=", startOfDay), (0, _firestore.where)("date", "<=", endOfWeekString));
          return _context21.abrupt("break", 20);

        case 17:
          // Admins can see all classes for the week
          q = (0, _firestore.query)(timetableRef, (0, _firestore.where)("date", ">=", startOfDay), (0, _firestore.where)("date", "<=", endOfWeekString));
          return _context21.abrupt("break", 20);

        case 19:
          return _context21.abrupt("return", []);

        case 20:
          _context21.next = 22;
          return regeneratorRuntime.awrap((0, _firestore.getDocs)(q));

        case 22:
          querySnapshot = _context21.sent;
          classes = [];
          querySnapshot.forEach(function (doc) {
            classes.push(_objectSpread({
              id: doc.id
            }, doc.data()));
          });
          return _context21.abrupt("return", classes);

        case 28:
          _context21.prev = 28;
          _context21.t1 = _context21["catch"](0);
          console.error("Error fetching upcoming week's classes:", _context21.t1);
          return _context21.abrupt("return", []);

        case 32:
        case "end":
          return _context21.stop();
      }
    }
  }, null, null, [[0, 28]]);
};

exports.getUpcomingWeekClasses = getUpcomingWeekClasses;
//# sourceMappingURL=firebaseConfig.dev.js.map
