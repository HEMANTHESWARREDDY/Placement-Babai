import React, { useState, useEffect, useRef } from 'react';



import './PracticeHub.css';



// Web Audio API Sound Synthesizer - disabled to remove game sound effects



const playSound = (type) => {



return;



};



// Data Structures for Coding Games



const BUG_HUNTER_QUESTIONS = [



{



id: 1,



title: "Recursive Factorial (Java)",



language: "java",



description: "Identify the line with the bug that causes an infinite loop / stack overflow error.",



codeLines: [



"public int factorial(int n) {",



"    if (n <= 1) return 1;",



"    return n * factorial(n);",



"}"



],



buggyLineIndex: 2, // 0-indexed



explanation: "Line 3 should call factorial(n - 1) instead of factorial(n). Calling factorial(n) causes infinite recursion.",



xp: 15,



timeLimit: 45



},



{



id: 2,



title: "List Appender (Python)",



language: "python",



description: "Identify the line causing a mutable default argument side-effect in Python.",



codeLines: [



"def append_to_list(val, my_list=[]):",



"    my_list.append(val)",



"    return my_list"



],



buggyLineIndex: 0,



explanation: "Using a mutable default argument like my_list=[] in Python results in sharing the same list object across all calls that do not provide an argument.",



xp: 20,



timeLimit: 45



},



{



id: 3,



title: "Scope Variable (JavaScript)",



language: "javascript",



description: "Identify the line causing variable leakage or reference errors due to wrong keyword.",



codeLines: [



"function calculateTotal(prices) {",



"    for (var i = 0; i < prices.length; i++) {",



"        let price = prices[i];",



"    }",



"    console.log(price);",



"}"



],



buggyLineIndex: 4,



explanation: "Line 5 tries to log 'price' outside of the loop block, but price is declared with 'let' (block scoped), causing a ReferenceError.",



xp: 20,



timeLimit: 45



}



];



const OUTPUT_PREDICTOR_QUESTIONS = [



{



id: 1,



title: "Python List Nesting Length",



code: `lst = [1, 2, 3]



lst.append([4, 5])



print(len(lst))`,



options: ["3", "4", "5", "TypeError"],



correctOption: "4",



explanation: "lst.append() inserts the entire list [4, 5] as a single sublist element. The list becomes [1, 2, 3, [4, 5]], which has length 4.",



xp: 15,



timeLimit: 30



},



{



id: 2,



title: "JavaScript Coercion Magic",



code: `const result = '5' - 3 + '2';



console.log(result);`,



options: ["'22'", "'4'", "'8'", "NaN"],



correctOption: "'22'",



explanation: "'5' - 3 evaluates to the number 2 because subtraction triggers numeric conversion. Then 2 + '2' evaluates to string concatenation, resulting in '22'.",



xp: 20,



timeLimit: 30



},



{



id: 3,



title: "Java Post-Increment Quirks",



code: `int x = 5;



int y = x++;



int z = ++x;



System.out.println(x + y + z);`,



options: ["17", "18", "19", "20"],



correctOption: "19",



explanation: "y gets the value of x (5), then x becomes 6. Then ++x makes x become 7, and z gets 7. Total sum = 7 + 5 + 7 = 19.",



xp: 15,



timeLimit: 30



}



];



const CODE_SPRINT_QUESTIONS = [



{



id: 1,



title: "Correct implementation of String Reversal in JavaScript",



options: [



"str.split('').reverse().join('')",



"str.reverse().split('').join('')",



"str.join('').reverse().split('')",



"str.split().reverse().join()"



],



correctIndex: 0,



timeLimit: 30,



explanation: "Strings in JS must first be split into an array, reversed, and then joined back together.",



xp: 25



},



{



id: 2,



title: "Check if a number is even without modulo operator (%)",



options: [



"(num & 1) === 0",



"(num | 1) === 0",



"(num ^ 1) === 0",



"~num === 0"



],



correctIndex: 0,



timeLimit: 25,



explanation: "Bitwise AND with 1 checks the least significant bit. If it is 0, the number is even.",



xp: 30



}



];



const SQL_DETECTIVE_QUESTIONS = [



{



id: 1,



title: "Find the Second Highest Salary",



schema: "Employee Table: { id: INT, name: VARCHAR, salary: INT }",



task: "Find the employee name who has the second highest salary.",



options: [



"SELECT name FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 1;",



"SELECT name FROM Employee WHERE salary = (SELECT MAX(salary) FROM Employee);",



"SELECT name FROM Employee ORDER BY salary ASC LIMIT 1 OFFSET 1;",



"SELECT name FROM Employee GROUP BY salary HAVING COUNT(*) > 1;"



],



correctIndex: 0,



explanation: "Ordering by salary descending and applying LIMIT 1 OFFSET 1 skips the top salary and returns the next highest.",



xp: 20,



timeLimit: 45



},



{



id: 2,



title: "Find Duplicate Emails",



schema: "Person Table: { id: INT, email: VARCHAR }",



task: "Write a SQL query to find all duplicate emails in the Person table.",



options: [



"SELECT email FROM Person GROUP BY email HAVING COUNT(email) > 1;",



"SELECT DISTINCT email FROM Person WHERE id > 1;",



"SELECT email FROM Person WHERE COUNT(email) > 1;",



"SELECT email FROM Person ORDER BY email HAVING UNIQUE = FALSE;"



],



correctIndex: 0,



explanation: "GROUP BY email groups all identical emails, and HAVING COUNT(email) > 1 filters only those that appear more than once.",



xp: 20,



timeLimit: 45



}



];



const ERROR_FIX_QUESTIONS = [



{



id: 1,



title: "TypeScript Null Check Crash",



codeSnippet: `function greet(user: { name: string } | null) {



console.log("Hello, " + user.name.toUpperCase());



}`,



description: "This code throws a runtime error if 'user' is null. Choose the correct fix.",



options: [



"console.log(\"Hello, \" + (user?.name?.toUpperCase() ?? 'Guest'));",



"console.log(\"Hello, \" + user.name!.toUpperCase());",



"console.log(\"Hello, \" + user.name.toUpperCase() || 'Guest');",



"console.log(\"Hello, \" + user.name.toUpperCase() as any);"



],



correctIndex: 0,



explanation: "Using optional chaining user?.name?.toUpperCase() safely accesses properties and returns undefined/fallback if null.",



xp: 15,



timeLimit: 40



},



{



id: 2,



title: "Python UnboundLocalError",



codeSnippet: `count = 0



def increment():



count += 1



increment()`,



description: "This Python function throws UnboundLocalError when modifying variables in outer scope. Choose the fix.",



options: [



"Add 'global count' inside the increment() function body.",



"Pass count as a default argument: def increment(count=count).",



"Change count += 1 to count = count + 1.",



"Rename the variable count to another name."



],



correctIndex: 0,



explanation: "Python requires the 'global' (or 'nonlocal') keyword to modify variables defined in outer scopes inside a function.",



xp: 20,



timeLimit: 40



}



];



// MCQ Battle Arena Database



const MCQ_QUESTIONS = {



// Topics



java: [



{ q: "Which class is the superclass of all classes in Java?", a: ["Object", "Class", "String", "System"], c: 0 },



{ q: "Which keyword is used to prevent method overriding in Java?", a: ["static", "final", "abstract", "private"], c: 1 },



{ q: "What is the memory size of a 'char' data type in Java?", a: ["8 bits", "16 bits", "32 bits", "64 bits"], c: 1 }



],



python: [



{ q: "Which of the following data structures is immutable in Python?", a: ["List", "Dictionary", "Tuple", "Set"], c: 2 },



{ q: "What keyword is used to declare a function in Python?", a: ["func", "def", "define", "function"], c: 1 },



{ q: "How do you start a comment in Python?", a: ["//", "/*", "#", "--"], c: 2 }



],



dbms: [



{ q: "What does SQL stand for?", a: ["Structured Query Language", "Structured Question Language", "Strong Query Language", "Sequential Query Language"], c: 0 },



{ q: "Which Normal Form is concerned with transitive dependencies?", a: ["1NF", "2NF", "3NF", "BCNF"], c: 2 },



{ q: "What type of key uniquely identifies a row in a table?", a: ["Foreign Key", "Super Key", "Primary Key", "Composite Key"], c: 2 }



],



os: [



{ q: "What is a deadlock?", a: ["A crash in kernel", "A state where processes wait indefinitely for resources", "An infinite CPU loop", "Low memory condition"], c: 1 },



{ q: "Which scheduling algorithm is non-preemptive?", a: ["Round Robin", "Shortest Job First (SJF)", "Priority Scheduling", "FCFS (First Come First Served)"], c: 3 },



{ q: "What is virtual memory?", a: ["RAM extension using hard disk space", "Super-fast cache", "CPU registers", "Cloud storage"], c: 0 }



],



cn: [



{ q: "Which layer of the OSI model is responsible for routing?", a: ["Data Link Layer", "Network Layer", "Transport Layer", "Physical Layer"], c: 1 },



{ q: "What does HTTP stand for?", a: ["Hypertext Transfer Protocol", "Hypertext Transmission Protocol", "High Transfer Text Protocol", "Hyper Transfer Protocol"], c: 0 },



{ q: "Which protocol is connection-oriented?", a: ["UDP", "IP", "TCP", "DNS"], c: 2 }



],



oops: [



{ q: "Which OOP concept allows a class to have multiple methods with the same name but different parameters?", a: ["Overriding", "Overloading", "Encapsulation", "Inheritance"], c: 1 },



{ q: "What is abstract class instantiation behavior?", a: ["Can be instantiated directly", "Cannot be instantiated directly", "Can only have abstract methods", "None of the above"], c: 1 },



{ q: "What does inheritance solve?", a: ["Data hiding", "Code reusability", "Polymorphism", "Garbage collection"], c: 1 }



],



aptitude: [



{ q: "A train running at 54 km/hr crosses a post in 9 seconds. What is length of train?", a: ["135 m", "150 m", "120 m", "180 m"], c: 0 },



{ q: "If A and B can do a work in 12 days, B and C in 15 days, C and A in 20 days. How many days for A alone?", a: ["30 days", "40 days", "24 days", "20 days"], c: 0 },



{ q: "Find the odd one out: 3, 5, 11, 14, 17, 21", a: ["14", "21", "17", "11"], c: 0 }



],



// Companies



amazon: [



{ q: "Which data structure is typically used for implementing LRU Cache?", a: ["Hashmap + Doubly Linked List", "Binary Search Tree", "Stack", "Queue"], c: 0 },



{ q: "What is time complexity of searching in a perfectly balanced Binary Search Tree?", a: ["O(1)", "O(log N)", "O(N)", "O(N log N)"], c: 1 }



],



tcs: [



{ q: "Which SQL operator is used for pattern matching?", a: ["LIKE", "IN", "BETWEEN", "EXISTS"], c: 0 },



{ q: "Which sorting algorithm is typically stable?", a: ["Merge Sort", "Quick Sort", "Heap Sort", "Selection Sort"], c: 0 }



],



infosys: [



{ q: "What is the size of boolean variable in Java?", a: ["1 bit", "8 bits", "Size is VM dependent", "16 bits"], c: 2 },



{ q: "Which data structure operates on LIFO principle?", a: ["Queue", "Stack", "List", "Tree"], c: 1 }



]



};



// Zip Puzzle Level Definition (LinkedIn Zip Game layout)



const ZIP_LEVEL = {



name: "LinkedIn Zip Challenge",



difficulty: "Hard",



rows: 8,



cols: 6,



xp: 30,



numbers: {



"0,0": 1,



"4,2": 2,



"7,0": 3,



"4,4": 4,



"2,1": 5,



"1,5": 6,



"5,4": 7,



"7,2": 8



},



walls: {



"V:2,0": true,



"H:2,2": true,



"H:5,2": true,



},



// The exact solution path segments for each pair for the Hint button:



solution: {



0: [



[0,0],[1,0],[2,0],[3,0],[3,1],[3,2],[4,2],[5,2],[5,1],[4,1],[4,0],[5,0],[6,0],[7,0],[7,1],[6,1],[6,2],[6,3],[5,3],[4,3],[4,4],[3,4],[3,3],[2,3],[1,3],[1,2],[2,2],[2,1],[1,1],[0,1],[0,2],[0,3],[0,4],[0,5],[1,5],[1,4],[2,4],[2,5],[3,5],[4,5],[5,5],[5,4],[6,4],[6,5],[7,5],[7,4],[7,3],[7,2]



]



}



};



const SEGMENT_COLORS = [



'#2563eb', // Blue



'#2563eb', // Blue



'#2563eb', // Blue



'#2563eb', // Blue



];



function PracticeHub() {



const [activeTab, setActiveTab] = useState('coding-games');



const [xp, setXp] = useState(() => parseInt(localStorage.getItem('ph_xp') || '120', 10));



const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('ph_streak') || '5', 10));



const [unlockedBadges, setUnlockedBadges] = useState(() => {



const saved = localStorage.getItem('ph_badges');



return saved ? JSON.parse(saved) : ["🐛 Bug Hunter Cadet", "🔥 Streak Master"];



});



const [activeGame, setActiveGame] = useState(null); // 'bug-hunter', 'output-predictor', 'code-sprint', 'sql-detective', 'error-fix', 'daily-quiz', 'company-quiz'



const [gameState, setGameState] = useState({



currentQuestionIndex: 0,



selectedOption: null,



isAnswered: false,



timerLeft: 0,



selectedBugLine: null,



correctCount: 0,



showResults: false,



totalTimeSpent: 0



});



// Zip game states



const [zipPaths, setZipPaths] = useState({



0: [[0,0]]



});



const [activePair, setActivePair] = useState(0);



const [zipTime, setZipTime] = useState(0);



const [zipStarted, setZipStarted] = useState(false);



const [zipWin, setZipWin] = useState(false);



const [hintCooldown, setHintCooldown] = useState(0);



const [zipHistory, setZipHistory] = useState([]);



const [isDrawing, setIsDrawing] = useState(false);



const zipTimerRef = useRef(null);



// Global mouseup listener to stop drawing



useEffect(() => {



const handleGlobalMouseUp = () => {



setIsDrawing(false);



};



window.addEventListener('mouseup', handleGlobalMouseUp);



return () => window.removeEventListener('mouseup', handleGlobalMouseUp);



}, []);



// Zip game timer effect



useEffect(() => {



if (activeGame === 'zip' && !zipWin && zipStarted) {



zipTimerRef.current = setInterval(() => {



setZipTime(prev => prev + 1);



}, 1000);



}



return () => clearInterval(zipTimerRef.current);



}, [activeGame, zipWin, zipStarted]);



// Effect to start zip timer when user starts drawing / makes a move
useEffect(() => {
  if (activeGame === 'zip') {
    const path = zipPaths[0] || [];
    if (path.length > 1 && !zipStarted) {
      setZipStarted(true);
    }
  }
}, [zipPaths, activeGame, zipStarted]);



// Hint cooldown effect
useEffect(() => {
  if (hintCooldown > 0) {
    const timer = setTimeout(() => {
      setHintCooldown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }
}, [hintCooldown]);



const selectZipLevel = () => {



// Levels not required anymore



};



const handleZipReset = () => {



setZipPaths({



0: [[0,0]]



});



setActivePair(0);



setZipWin(false);



setZipHistory([]);



setZipStarted(false);



setZipTime(0);



setHintCooldown(0);



};



const handleZipUndo = () => {



if (zipHistory.length > 0) {



const prevPaths = zipHistory[zipHistory.length - 1];



setZipPaths(prevPaths);



setZipHistory(prev => prev.slice(0, -1));



playSound('success');



}



};



const checkWinCondition = (newPaths) => {



const path = newPaths[0];



if (!path || path.length !== 48) return false;



const lastCell = path[path.length - 1];



const numEnd = ZIP_LEVEL.numbers[`${lastCell[0]},${lastCell[1]}`];



return numEnd === 8;



};



const handleZipHint = (level) => {



if (zipWin || hintCooldown > 0) return;



setHintCooldown(6);



const currentPath = zipPaths[0];



const solutionPath = level.solution[0];



// Check if the current path is a prefix of the solution



let isPrefix = true;



for (let i = 0; i < currentPath.length; i++) {



if (currentPath[i][0] !== solutionPath[i][0] || currentPath[i][1] !== solutionPath[i][1]) {



isPrefix = false;



break;



}



}



if (isPrefix) {



const nextCell = solutionPath[currentPath.length];



if (nextCell) {



const newPath = [...currentPath, nextCell];



const newPaths = { 0: newPath };



setZipHistory(prev => [...prev, zipPaths]);



setZipPaths(newPaths);



const targetNum = level.numbers[`${nextCell[0]},${nextCell[1]}`];



if (targetNum) {



playSound('success');



}



if (checkWinCondition(newPaths)) {



setZipWin(true);



playSound('level-up');



gainXp(level.xp);



triggerBadge("🔗 Master of Zip");



localStorage.setItem('ph_high_zip', '1');



setHighScores(prev => ({ ...prev, 'zip': '1' }));



}



}



} else {



let mismatchIdx = 0;



for (let i = 0; i < currentPath.length; i++) {



if (currentPath[i][0] !== solutionPath[i][0] || currentPath[i][1] !== solutionPath[i][1]) {



mismatchIdx = i;



break;



}



}



const correctedPath = solutionPath.slice(0, mismatchIdx + 1);



const newPaths = { 0: correctedPath };



setZipHistory(prev => [...prev, zipPaths]);



setZipPaths(newPaths);



playSound('success');



}



};



const handleDragStart = (r, c, level) => {



if (zipWin) return;



const numVal = level.numbers[`${r},${c}`];



if (numVal === 1) {



setActivePair(0);



setZipHistory(prev => [...prev, zipPaths]);



setZipPaths({ 0: [[r, c]] });



setIsDrawing(true);



playSound('success');



return;



}



const path = zipPaths[0] || [];



const idx = path.findIndex(([pr, pc]) => pr === r && pc === c);



if (idx !== -1) {



setActivePair(0);



setIsDrawing(true);



if (idx < path.length - 1) {



setZipHistory(prev => [...prev, zipPaths]);



setZipPaths({ 0: path.slice(0, idx + 1) });



}



playSound('success');



}



};



const handleDragMove = (r, c, level) => {



if (zipWin || !isDrawing) return;



const currentPath = zipPaths[0];



if (!currentPath || currentPath.length === 0) return;



const [hr, hc] = currentPath[currentPath.length - 1];



if (hr === r && hc === c) return;



const isAdjacent = (Math.abs(hr - r) === 1 && hc === c) || (Math.abs(hc - c) === 1 && hr === r);



if (!isAdjacent) return;



if (currentPath.length > 1) {



const [prevR, prevC] = currentPath[currentPath.length - 2];



if (prevR === r && prevC === c) {



setZipHistory(prev => [...prev, zipPaths]);



setZipPaths({ 0: currentPath.slice(0, -1) });



playSound('success');



return;



}



}



const headNum = level.numbers[`${hr},${hc}`];



if (headNum === 8) return;



const occupied = currentPath.some(([pr, pc]) => pr === r && pc === c);



if (occupied) return;



const hasWall = (r1, c1, r2, c2, lvl) => {



if (r1 === r2) {



const minC = Math.min(c1, c2);



return lvl.walls[`V:${r1},${minC}`] || false;



}



if (c1 === c2) {



const minR = Math.min(r1, r2);



return lvl.walls[`H:${minR},${c1}`] || false;



}



return false;



};



if (hasWall(hr, hc, r, c, level)) return;



const enteredNum = level.numbers[`${r},${c}`];



if (enteredNum) {



let maxVisited = 1;



for (const [pr, pc] of currentPath) {



const num = level.numbers[`${pr},${pc}`];



if (num && num > maxVisited) {



maxVisited = num;



}



}



if (enteredNum !== maxVisited + 1) {



return;



}



}



const newPath = [...currentPath, [r, c]];



const newPaths = { 0: newPath };



setZipHistory(prev => [...prev, zipPaths]);



setZipPaths(newPaths);



if (enteredNum) {



playSound('success');



}



if (checkWinCondition(newPaths)) {



setZipWin(true);



setIsDrawing(false);



playSound('level-up');



gainXp(level.xp);



triggerBadge("🔗 Master of Zip");



localStorage.setItem('ph_high_zip', '1');



setHighScores(prev => ({ ...prev, 'zip': '1' }));



}



};



const handleTouchMove = (e, level) => {



if (e.cancelable) e.preventDefault();



if (zipWin || !isDrawing) return;



const touch = e.touches[0];



const element = document.elementFromPoint(touch.clientX, touch.clientY);



if (element) {



const cell = element.closest('.zip-cell');



if (cell) {



const r = parseInt(cell.getAttribute('data-row'), 10);



const c = parseInt(cell.getAttribute('data-col'), 10);



if (!isNaN(r) && !isNaN(c)) {



handleDragMove(r, c, level);



}



}



}



};



const getPathConnections = (r, c) => {



const path = zipPaths[0];



if (!path) return { top: false, right: false, bottom: false, left: false, color: '', pairIdx: -1, pathIdx: -1 };



const idx = path.findIndex(([pr, pc]) => pr === r && pc === c);



if (idx === -1) return { top: false, right: false, bottom: false, left: false, color: '', pairIdx: -1, pathIdx: -1 };



let maxVisited = 1;



for (let i = 0; i <= idx; i++) {



const num = ZIP_LEVEL.numbers[`${path[i][0]},${path[i][1]}`];



if (num && num > maxVisited) {



maxVisited = num;



}



}



const color = SEGMENT_COLORS[Math.floor((maxVisited - 1) / 2) % SEGMENT_COLORS.length];



const conn = { top: false, right: false, bottom: false, left: false, color, pairIdx: 0, pathIdx: idx };



if (idx > 0) {



const [pr, pc] = path[idx - 1];



if (pr < r) conn.top = true;



if (pr > r) conn.bottom = true;



if (pc < c) conn.left = true;



if (pc > c) conn.right = true;



}



if (idx < path.length - 1) {



const [nr, nc] = path[idx + 1];



if (nr < r) conn.top = true;



if (nr > r) conn.bottom = true;



if (nc < c) conn.left = true;



if (nc > c) conn.right = true;



}



return conn;



};



const formatTime = (totalSeconds) => {



const mins = Math.floor(totalSeconds / 60);



const secs = totalSeconds % 60;



return `${mins}:${secs < 10 ? '0' : ''}${secs}`;



};



// MCQ Battle state



const [mcqMode, setMcqMode] = useState(null); // 'daily', 'battle', 'company'



const [mcqTopic, setMcqTopic] = useState('java');
  const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState(false);
  
  const COMBAT_TOPICS = [
    { id: 'java', label: 'Java Programming', icon: '☕' },
    { id: 'python', label: 'Python Programming', icon: '🐍' },
    { id: 'dbms', label: 'DBMS / SQL', icon: '💾' },
    { id: 'os', label: 'OS', icon: '💻' },
    { id: 'cn', label: 'Computer Networks', icon: '🌐' },
    { id: 'oops', label: 'OOP Concepts', icon: '🧱' },
    { id: 'aptitude', label: 'Quantitative Aptitude', icon: '🧮' }
  ];



const [mcqCompany, setMcqCompany] = useState('tcs');



// 1v1 Battle states



const [battleState, setBattleState] = useState({



playerHp: 100,



opponentHp: 100,



currentQIndex: 0,



isAnswered: false,



selectedOption: null,



battleLog: "Choose an option to attack!",



battleOver: false,



win: false



});



const [battleTimer, setBattleTimer] = useState(20);



const battleTimerRef = useRef(null);



const [showBadgeToast, setShowBadgeToast] = useState(null);



// High Scores list



const [highScores, setHighScores] = useState({



'bug-hunter': localStorage.getItem('ph_high_bug-hunter') || '0',



'output-predictor': localStorage.getItem('ph_high_output-predictor') || '0',



'code-sprint': localStorage.getItem('ph_high_code-sprint') || '0',



'sql-detective': localStorage.getItem('ph_high_sql-detective') || '0',



'error-fix': localStorage.getItem('ph_high_error-fix') || '0',



'daily-quiz': localStorage.getItem('ph_high_daily-quiz') || '0',



'company-quiz': localStorage.getItem('ph_high_company-quiz') || '0',



'zip': localStorage.getItem('ph_high_zip') || '0'



});



// Leaderboard state



const [leaderboard, setLeaderboard] = useState([



{ name: "Rahul S. (TCS Assassin)", xp: 450, rank: 1 },



{ name: "Sneha Reddy (Python Pro)", xp: 390, rank: 2 },



{ name: "Amit Kumar (SQL Guru)", xp: 320, rank: 3 },



{ name: "You", xp: xp, rank: 4 },



{ name: "Kunal Verma (Java Champ)", xp: 90, rank: 5 }



]);



// Timer Ref



const timerRef = useRef(null);



useEffect(() => {



localStorage.setItem('ph_xp', xp.toString());



localStorage.setItem('ph_streak', streak.toString());



localStorage.setItem('ph_badges', JSON.stringify(unlockedBadges));



// Update leaderboard rank dynamically



setLeaderboard(prev => {



const updated = prev.map(u => u.name === "You" ? { ...u, xp: xp } : u);



updated.sort((a, b) => b.xp - a.xp);



return updated.map((u, i) => ({ ...u, rank: i + 1 }));



});



}, [xp, streak, unlockedBadges]);



// Toast badge alert helper



const triggerBadge = (badgeName) => {



if (!unlockedBadges.includes(badgeName)) {



setUnlockedBadges(prev => [...prev, badgeName]);



setShowBadgeToast(badgeName);



playSound('level-up');



setTimeout(() => {



setShowBadgeToast(null);



}, 4000);



}



};



// XP Incrementor helper



const gainXp = (amount) => {



setXp(prev => {



const newXp = prev + amount;



if (newXp >= 200 && prev < 200) {



setTimeout(() => triggerBadge("🎓 MCQ Gladiator"), 500);



}



if (newXp >= 350 && prev < 350) {



setTimeout(() => triggerBadge("🏆 Code Sprint Champion"), 500);



}



return newXp;



});



};



// Generic game timer effect (Bug Hunter, Output Predictor, Code Sprint, SQL Detective, Error Fix, Daily/Company quizzes)



useEffect(() => {



if (activeGame && !gameState.isAnswered && !gameState.showResults) {



timerRef.current = setInterval(() => {



setGameState(prev => {



if (prev.timerLeft <= 1) {



clearInterval(timerRef.current);



playSound('error');



return {



...prev,



timerLeft: 0,



isAnswered: true,



selectedOption: -1, // -1 means Timeout



selectedBugLine: -1



};



}



return {



...prev,



timerLeft: prev.timerLeft - 1,



totalTimeSpent: prev.totalTimeSpent + 1



};



});



}, 1000);



}



return () => clearInterval(timerRef.current);



}, [activeGame, gameState.currentQuestionIndex, gameState.isAnswered, gameState.showResults]);



// 1v1 Battle Arena Turn Timer Effect



useEffect(() => {



if (mcqMode === 'battle' && !battleState.battleOver && !battleState.isAnswered) {



setBattleTimer(20);



battleTimerRef.current = setInterval(() => {



setBattleTimer(prev => {



if (prev <= 1) {



clearInterval(battleTimerRef.current);



playSound('error');



// Opponent deals automatic hit because of timeout



const dmg = Math.floor(Math.random() * 10) + 15;



const nextHp = Math.max(0, battleState.playerHp - dmg);



const over = nextHp <= 0;



setBattleState(s => ({



...s,



isAnswered: true,



selectedOption: -1,



playerHp: nextHp,



battleLog: `⏱️ Time ran out! Opponent struck you for ${dmg} damage!`,



battleOver: over,



win: false



}));



return 0;



}



return prev - 1;



});



}, 1000);



}



return () => clearInterval(battleTimerRef.current);



}, [mcqMode, battleState.currentQIndex, battleState.battleOver, battleState.isAnswered]);



// Close Game/Quiz and return to menu



const backToMenu = () => {



clearInterval(timerRef.current);



clearInterval(battleTimerRef.current);



clearInterval(zipTimerRef.current);



setActiveGame(null);



setHintCooldown(0);



setGameState({



currentQuestionIndex: 0,



selectedOption: null,



isAnswered: false,



timerLeft: 0,



selectedBugLine: null,



correctCount: 0,



showResults: false,



totalTimeSpent: 0



});



setMcqMode(null);



setBattleState({



playerHp: 100,



opponentHp: 100,



currentQIndex: 0,



isAnswered: false,



selectedOption: null,



battleLog: "Choose an option to attack!",



battleOver: false,



win: false



});



};



// Helper to fetch question list for a game key



const getQuestionsList = (key) => {



switch (key) {



case 'bug-hunter': return BUG_HUNTER_QUESTIONS;



case 'output-predictor': return OUTPUT_PREDICTOR_QUESTIONS;



case 'code-sprint': return CODE_SPRINT_QUESTIONS;



case 'sql-detective': return SQL_DETECTIVE_QUESTIONS;



case 'error-fix': return ERROR_FIX_QUESTIONS;



case 'daily-quiz': return MCQ_QUESTIONS[mcqTopic] ? [MCQ_QUESTIONS[mcqTopic][0]] : [];



case 'company-quiz': return [ MCQ_QUESTIONS['tcs'][0], MCQ_QUESTIONS['amazon'][0], MCQ_QUESTIONS['infosys'][0] ];



default: return [];



}



};



// Start Games/Quizzes



const startGame = (gameKey) => {



setActiveGame(gameKey);



if (gameKey === 'zip') {



setZipPaths({



0: [[0,0]]



});



setActivePair(0);



setZipTime(0);



setZipStarted(false);



setZipWin(false);



setHintCooldown(0);



return;



}



const questionsList = getQuestionsList(gameKey);



const firstQTime = questionsList[0]?.timeLimit || 30;



setGameState({



currentQuestionIndex: 0,



selectedOption: null,



isAnswered: false,



timerLeft: firstQTime,



selectedBugLine: null,



correctCount: 0,



showResults: false,



totalTimeSpent: 0



});



};



// Bug Hunter selection



const selectBugLine = (lineIdx) => {



if (gameState.isAnswered) return;



clearInterval(timerRef.current);



const currentQ = BUG_HUNTER_QUESTIONS[gameState.currentQuestionIndex];



const correct = lineIdx === currentQ.buggyLineIndex;



if (correct) {



playSound('success');



gainXp(currentQ.xp);



setGameState(prev => ({



...prev,



selectedBugLine: lineIdx,



isAnswered: true,



correctCount: prev.correctCount + 1



}));



} else {



playSound('error');



setGameState(prev => ({



...prev,



selectedBugLine: lineIdx,



isAnswered: true



}));



}



};



// General option selection for Multiple Choice games



const selectOptionGame = (optIdx, gameType) => {



if (gameState.isAnswered) return;



clearInterval(timerRef.current);



const questionsList = getQuestionsList(gameType);



const currentQ = questionsList[gameState.currentQuestionIndex];



let correct = false;



if (gameType === 'output-predictor') {



correct = currentQ.options[optIdx] === currentQ.correctOption;



} else if (gameType === 'daily-quiz' || gameType === 'company-quiz') {



correct = optIdx === currentQ.c;



} else {



correct = optIdx === currentQ.correctIndex;



}



const xpAward = currentQ.xp || (gameType === 'daily-quiz' ? 30 : 15);



if (correct) {



playSound('success');



gainXp(xpAward);



setGameState(prev => ({



...prev,



selectedOption: optIdx,



isAnswered: true,



correctCount: prev.correctCount + 1



}));



} else {



playSound('error');



setGameState(prev => ({



...prev,



selectedOption: optIdx,



isAnswered: true



}));



}



};



// Next Question loop



const nextQuestion = (gameType) => {



const questionsList = getQuestionsList(gameType);



if (gameState.currentQuestionIndex + 1 < questionsList.length) {



const nextIdx = gameState.currentQuestionIndex + 1;



const nextTime = questionsList[nextIdx].timeLimit || 30;



setGameState(prev => ({



...prev,



currentQuestionIndex: nextIdx,



selectedOption: null,



isAnswered: false,



timerLeft: nextTime,



selectedBugLine: null



}));



} else {



// Game Finished: Calculate Highscore & Badges



const finalCorrect = gameState.correctCount;



const currentHigh = parseInt(highScores[gameType] || '0', 10);



if (finalCorrect > currentHigh) {



localStorage.setItem(`ph_high_${gameType}`, finalCorrect.toString());



setHighScores(prev => ({ ...prev, [gameType]: finalCorrect.toString() }));



}



// Award badges for perfect runs



if (finalCorrect === questionsList.length) {



if (gameType === 'bug-hunter') triggerBadge("🐛 Master Bug Squasher");



if (gameType === 'sql-detective') triggerBadge("🕵️ SQL Detective Cadet");



if (gameType === 'code-sprint') triggerBadge("⚡ Lightning Sprinter");



}



setGameState(prev => ({ ...prev, showResults: true }));



}



};



// MCQ Battle System



const handleBattleMcqAnswer = (optIdx, questionsList) => {



if (battleState.isAnswered || battleState.battleOver) return;



clearInterval(battleTimerRef.current);



const currentQ = questionsList[battleState.currentQIndex];



const isCorrect = optIdx === currentQ.c;



let dmgPlayer = 0;



let dmgOpponent = 0;



let logMsg = "";



if (isCorrect) {



playSound('success');



// Deal quick bonus damage based on time left!



const speedBonus = Math.floor(battleTimer / 2);



dmgOpponent = 20 + speedBonus;



logMsg = `🔥 Correct! Striking opponent for ${dmgOpponent} damage (includes +${speedBonus} speed bonus)!`;



} else {



playSound('error');



dmgPlayer = Math.floor(Math.random() * 10) + 15;



logMsg = `⚠️ Incorrect! You missed. Opponent counter strikes for ${dmgPlayer} damage!`;



}



// Simulating standard opponent action if player was correct



if (isCorrect) {



const oppCorrect = Math.random() > 0.45;



if (oppCorrect) {



const oppDmg = Math.floor(Math.random() * 10) + 10;



dmgPlayer += oppDmg;



logMsg += ` Opponent fires back dealing ${oppDmg} damage!`;



} else {



logMsg += " Opponent missed their counter!";



}



}



const nextHpPlayer = Math.max(0, battleState.playerHp - dmgPlayer);



const nextHpOpponent = Math.max(0, battleState.opponentHp - dmgOpponent);



let over = false;



let playerWins = false;



if (nextHpOpponent <= 0) {



over = true;



playerWins = true;



logMsg = "🏆 VICTORY! Opponent has been defeated! +50 XP";



gainXp(50);



triggerBadge("⚔️ Arena Overlord");



} else if (nextHpPlayer <= 0) {



over = true;



playerWins = false;



logMsg = "💀 DEFEAT! Opponent overpowered you. Keep practicing!";



}



setBattleState(prev => ({



...prev,



isAnswered: true,



selectedOption: optIdx,



playerHp: nextHpPlayer,



opponentHp: nextHpOpponent,



battleLog: logMsg,



battleOver: over,



win: playerWins



}));



};



const nextBattleQuestion = (questionsList) => {



if (battleState.battleOver) return;



if (battleState.currentQIndex + 1 < questionsList.length) {



setBattleState(prev => ({



...prev,



currentQIndex: prev.currentQIndex + 1,



isAnswered: false,



selectedOption: null,



battleLog: "Prepare for the next strike!"



}));



} else {



// Out of questions - compare remaining HP



const playerWins = battleState.playerHp > battleState.opponentHp;



let logMsg = playerWins



? "🏆 TIME UP! You had higher remaining HP. Victory! +30 XP"



: "💀 TIME UP! Opponent had higher remaining HP. Defeat!";



if (playerWins) gainXp(30);



setBattleState(prev => ({



...prev,



battleOver: true,



win: playerWins,



battleLog: logMsg



}));



}



};



// Calculate dynamic rating string for scoreboard



const getRating = (correct, total) => {



const accuracy = (correct / total) * 100;



if (accuracy === 100) return "Elite Coder ⚡";



if (accuracy >= 70) return "Senior Developer 🛠️";



if (accuracy >= 45) return "Junior Apprentice 🎓";



return "Trainee 🐛";



};



return (



<div className="ph-container">



{/* Gamified Hero Header */}



<div className="ph-hero">



<div className="ph-hero-content">



<div className="ph-title-area">



<h1>PracticeHub</h1>



<p>Unlock placements through gamified code workouts & real-time battle arenas.</p>



</div>



<div className="ph-user-stats-widget">



<div className="ph-stat-pill">



<span className="ph-stat-label">Total XP</span>



<span className="ph-stat-val xp">⭐ {xp} XP</span>



</div>



<div className="ph-divider" />



<div className="ph-stat-pill">



<span className="ph-stat-label">Daily Streak</span>



<span className="ph-stat-val streak">🔥 {streak} Days</span>



</div>



{/* Temporarily disabled My Badges column



<div className="ph-divider" />



<div className="ph-stat-pill">



<span className="ph-stat-label">My Badges</span>



<div className="ph-badges-showcase">



{unlockedBadges.map((badge, i) => (



<span



key={i}



className="ph-badge-item"



title={badge}



>



{badge.split(' ')[0]}



</span>



))}



</div>



</div>



*/}



</div>



</div>



</div>



{/* Main Content Workspace Layout */}



<div className="ph-workspace">



{/* Left Workspace Panel */}



<div className="ph-left-panel">



<div className="ph-tab-nav">



<button



className={`ph-tab-btn ${activeTab === 'coding-games' ? 'active' : ''}`}



onClick={() => { setActiveTab('coding-games'); backToMenu(); }}



>



🎮 Coding Games



</button>



<button



className={`ph-tab-btn ${activeTab === 'mcq-battle' ? 'active' : ''}`}



onClick={() => { setActiveTab('mcq-battle'); backToMenu(); }}



>



🧠 MCQ Battle Arena



</button>



</div>



{/* Tab 1: Coding Games List */}



{activeTab === 'coding-games' && (



<div className="ph-games-grid">



<div className="ph-card" onClick={() => startGame('bug-hunter')}>



<div className="ph-card-header">



<span className="ph-card-icon">🐛</span>



<h3>Bug Hunter</h3>



</div>



<p>Find syntax & logic bugs inside raw Java, Python & JavaScript snippets before compile time.</p>



<div className="ph-card-meta">



<span className="ph-card-reward">🏆 +15 XP</span>



<div className="ph-personal-best">Personal Best: {highScores['bug-hunter']}/{BUG_HUNTER_QUESTIONS.length}</div>



</div>



</div>



<div className="ph-card" onClick={() => startGame('output-predictor')}>



<div className="ph-card-header">



<span className="ph-card-icon">🔮</span>



<h3>Output Predictor</h3>



</div>



<p>Analyze code blocks with complex variable scope, data mutation & coercion to predict output.</p>



<div className="ph-card-meta">



<span className="ph-card-reward">🏆 +15 XP</span>



<div className="ph-personal-best">Personal Best: {highScores['output-predictor']}/{OUTPUT_PREDICTOR_QUESTIONS.length}</div>



</div>



</div>



<div className="ph-card" onClick={() => startGame('code-sprint')}>



<div className="ph-card-header">



<span className="ph-card-icon">⚡</span>



<h3>Code Sprint</h3>



</div>



<p>Solve core DSA implementation questions against a fast ticking timer limit.</p>



<div className="ph-card-meta">



<span className="ph-card-reward">🏆 +25 XP</span>



<div className="ph-personal-best">Personal Best: {highScores['code-sprint']}/{CODE_SPRINT_QUESTIONS.length}</div>



</div>



</div>



<div className="ph-card" onClick={() => startGame('sql-detective')}>



<div className="ph-card-header">



<span className="ph-card-icon">🕵️</span>



<h3>SQL Detective</h3>



</div>



<p>Translate schema descriptions & target statements into valid, optimized SQL queries.</p>



<div className="ph-card-meta">



<span className="ph-card-reward">🏆 +20 XP</span>



<div className="ph-personal-best">Personal Best: {highScores['sql-detective']}/{SQL_DETECTIVE_QUESTIONS.length}</div>



</div>



</div>



<div className="ph-card" onClick={() => startGame('error-fix')}>



<div className="ph-card-header">



<span className="ph-card-icon">🛠️</span>



<h3>Error Fix Challenge</h3>



</div>



<p>Receive broken scripts throwing NullPointer or scope errors and choose the optimal fix.</p>



<div className="ph-card-meta">



<span className="ph-card-reward">🏆 +15 XP</span>



<div className="ph-personal-best">Personal Best: {highScores['error-fix']}/{ERROR_FIX_QUESTIONS.length}</div>



</div>



</div>



<div className="ph-card" onClick={() => startGame('zip')}>



<div className="ph-card-header">



<span className="ph-card-icon">🔗</span>



<h3>Zip Puzzle</h3>



</div>



<p>Connect sequential numbers and fill every grid cell exactly once without crossing walls.</p>



<div className="ph-card-meta">



<span className="ph-card-reward">🏆 +20 XP</span>



<div className="ph-personal-best">Personal Best: {highScores['zip'] || 0}/2 Levels</div>



</div>



</div>



</div>



)}



{/* Game 1: Bug Hunter Play Zone */}



{activeGame === 'bug-hunter' && (



<div className="ph-play-zone">



<div className="ph-play-header">



<div className="ph-play-title-wrap">



<span className="ph-play-icon">🐛</span>



<h2>Bug Hunter {gameState.showResults ? <span className="ph-desktop-results-title"> - Results</span> : <span className="ph-play-sub-title">Question {gameState.currentQuestionIndex + 1} of {BUG_HUNTER_QUESTIONS.length}</span>}</h2>



</div>



<button className="ph-btn-back" onClick={backToMenu}>✕ <span className="ph-btn-back-text">Quit Game</span></button>



</div>



{gameState.showResults ? (



<div className="ph-results-screen">



<div className="ph-results-trophy">🏆</div>



<h2>Workout Scorecard</h2>



<p>Detailed performance analytics for this run:</p>



<div className="ph-results-grid">



<div className="ph-results-stat">



<span className="ph-results-stat-val">{gameState.correctCount}/{BUG_HUNTER_QUESTIONS.length}</span>



<div>Correct Lines Found</div>



</div>



<div className="ph-results-stat">



<span className="ph-results-stat-val">{Math.round((gameState.correctCount / BUG_HUNTER_QUESTIONS.length) * 100)}%</span>



<div>Accuracy</div>



</div>



<div className="ph-results-stat">



<span className="ph-results-stat-val">{gameState.totalTimeSpent}s</span>



<div>Total Time Taken</div>



</div>



<div className="ph-results-stat">



<span className="ph-results-stat-val">{getRating(gameState.correctCount, BUG_HUNTER_QUESTIONS.length)}</span>



<div>Rank Earned</div>



</div>



</div>



<div style={{ marginTop: '1.5rem', fontWeight: '700' }}>



Personal Best: {highScores['bug-hunter']}/{BUG_HUNTER_QUESTIONS.length}



</div>



<button className="ph-btn-primary ph-btn-scorecard-quit" onClick={backToMenu}>Quit to Hub</button>



</div>



) : (



<>



<div style={{ fontWeight: '600', fontSize: '1.05rem', marginBottom: '1rem', lineHeight: '1.5' }}>



{BUG_HUNTER_QUESTIONS[gameState.currentQuestionIndex].description}



</div>



<div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>


<div className="ph-timer-bar-container" style={{ flexGrow: 1, marginBottom: 0 }}>


<div


className={`ph-timer-bar-fill ${gameState.timerLeft <= 8 ? 'warning' : ''}`}


style={{ width: `${(gameState.timerLeft / BUG_HUNTER_QUESTIONS[gameState.currentQuestionIndex].timeLimit) * 100}%` }}


/>


</div>


<span style={{ color: gameState.timerLeft <= 8 ? 'var(--ph-danger)' : 'var(--ph-text)', fontWeight: '800', whiteSpace: 'nowrap', flexShrink: 0, fontSize: '0.9rem' }}>


⏱️ {gameState.timerLeft}s


</span>


{gameState.isAnswered && (


<button className="ph-btn-primary" onClick={() => nextQuestion('bug-hunter')} style={{ margin: 0 }}>


{gameState.currentQuestionIndex + 1 === BUG_HUNTER_QUESTIONS.length ? "Finish" : "Next"}


</button>


)}


</div>



<div className="ph-code-container interactive-selection" style={{ marginTop: '1.5rem' }}>



{BUG_HUNTER_QUESTIONS[gameState.currentQuestionIndex].codeLines.map((line, idx) => (



<div



key={idx}



className={`ph-code-line interactive ${gameState.selectedBugLine === idx ? 'selected-bug' : ''}`}



onClick={() => selectBugLine(idx)}



>



<span className="ph-line-marker"></span>



<span className="ph-line-num">{idx + 1}</span>



<span className="ph-line-content">{line}</span>



</div>



))}



</div>



{gameState.isAnswered && (



<div style={{ margin: '1.5rem 0', padding: '1rem', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid var(--ph-info)' }}>



<div className="ph-feedback-text" style={{ color: gameState.selectedBugLine === BUG_HUNTER_QUESTIONS[gameState.currentQuestionIndex].buggyLineIndex ? 'var(--ph-success)' : 'var(--ph-danger)', marginBottom: '0.5rem', fontWeight: '700' }}>



{gameState.selectedBugLine === -1 ? "⏱️ Timeout! Time ran out." : gameState.selectedBugLine === BUG_HUNTER_QUESTIONS[gameState.currentQuestionIndex].buggyLineIndex ? "✓ Correct Bug Line Identified!" : "✗ That line was not the bug source!"}



</div>



<p style={{ margin: 0, fontSize: '0.95rem' }}>



<strong>Explanation: </strong>



{BUG_HUNTER_QUESTIONS[gameState.currentQuestionIndex].explanation}



</p>



</div>



)}



</>



)}



</div>



)}



{/* Game 2: Output Predictor Play Zone */}



{activeGame === 'output-predictor' && (



<div className="ph-play-zone">



<div className="ph-play-header">



<div className="ph-play-title-wrap">



<span className="ph-play-icon">🔮</span>



<h2>Output Predictor {gameState.showResults ? <span className="ph-desktop-results-title"> - Results</span> : <span className="ph-play-sub-title">Question {gameState.currentQuestionIndex + 1} of {OUTPUT_PREDICTOR_QUESTIONS.length}</span>}</h2>



</div>



<button className="ph-btn-back" onClick={backToMenu}>✕ <span className="ph-btn-back-text">Quit Game</span></button>



</div>



{gameState.showResults ? (



<div className="ph-results-screen">



<div className="ph-results-trophy">🏆</div>



<h2>Workout Scorecard</h2>



<p>Detailed performance analytics for this run:</p>



<div className="ph-results-grid">



<div className="ph-results-stat">



<span className="ph-results-stat-val">{gameState.correctCount}/{OUTPUT_PREDICTOR_QUESTIONS.length}</span>



<div>Correct Outputs</div>



</div>



<div className="ph-results-stat">



<span className="ph-results-stat-val">{Math.round((gameState.correctCount / OUTPUT_PREDICTOR_QUESTIONS.length) * 100)}%</span>



<div>Accuracy</div>



</div>



<div className="ph-results-stat">



<span className="ph-results-stat-val">{gameState.totalTimeSpent}s</span>



<div>Total Time Taken</div>



</div>



<div className="ph-results-stat">



<span className="ph-results-stat-val">{getRating(gameState.correctCount, OUTPUT_PREDICTOR_QUESTIONS.length)}</span>



<div>Rank Earned</div>



</div>



</div>



<div style={{ marginTop: '1.5rem', fontWeight: '700' }}>



Personal Best: {highScores['output-predictor']}/{OUTPUT_PREDICTOR_QUESTIONS.length}



</div>



<button className="ph-btn-primary ph-btn-scorecard-quit" onClick={backToMenu}>Quit to Hub</button>



</div>



) : (



<>



<div style={{ fontWeight: '600', fontSize: '1.05rem', marginBottom: '1rem', lineHeight: '1.5' }}>


Predict the output of the following block:


</div>


<div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>


<div className="ph-timer-bar-container" style={{ flexGrow: 1, marginBottom: 0 }}>


<div


className={`ph-timer-bar-fill ${gameState.timerLeft <= 6 ? 'warning' : ''}`}


style={{ width: `${(gameState.timerLeft / OUTPUT_PREDICTOR_QUESTIONS[gameState.currentQuestionIndex].timeLimit) * 100}%` }}


/>


</div>


<span style={{ color: gameState.timerLeft <= 6 ? 'var(--ph-danger)' : 'var(--ph-text)', fontWeight: '800', whiteSpace: 'nowrap', flexShrink: 0, fontSize: '0.9rem' }}>


⏱️ {gameState.timerLeft}s


</span>


{gameState.isAnswered && (


<button className="ph-btn-primary" onClick={() => nextQuestion('output-predictor')} style={{ margin: 0 }}>


{gameState.currentQuestionIndex + 1 === OUTPUT_PREDICTOR_QUESTIONS.length ? "Finish" : "Next"}


</button>


)}


</div>



<div className="ph-code-container" style={{ marginTop: '1.5rem' }}>



<code>{OUTPUT_PREDICTOR_QUESTIONS[gameState.currentQuestionIndex].code}</code>



</div>



<div className="ph-options-grid">



{OUTPUT_PREDICTOR_QUESTIONS[gameState.currentQuestionIndex].options.map((opt, idx) => {



const isCorrect = opt === OUTPUT_PREDICTOR_QUESTIONS[gameState.currentQuestionIndex].correctOption;



const isSelected = gameState.selectedOption === idx;



let btnClass = "";



if (gameState.isAnswered) {



if (isCorrect) btnClass = "correct";



else if (isSelected) btnClass = "incorrect";



}



return (



<button



key={idx}



className={`ph-option-btn ${btnClass}`}



onClick={() => selectOptionGame(idx, 'output-predictor')}



disabled={gameState.isAnswered}



>



<span>{opt}</span>



<span className="ph-option-marker">



{gameState.isAnswered && isCorrect ? "✓" : gameState.isAnswered && isSelected ? "✗" : String.fromCharCode(65 + idx)}



</span>



</button>



);



})}



</div>



{gameState.isAnswered && (



<div style={{ margin: '1.5rem 0', padding: '1rem', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid var(--ph-info)' }}>



<div className="ph-feedback-text" style={{ color: gameState.selectedOption === -1 ? 'var(--ph-danger)' : (OUTPUT_PREDICTOR_QUESTIONS[gameState.currentQuestionIndex].options[gameState.selectedOption] === OUTPUT_PREDICTOR_QUESTIONS[gameState.currentQuestionIndex].correctOption ? 'var(--ph-success)' : 'var(--ph-danger)'), marginBottom: '0.5rem', fontWeight: '700' }}>



{gameState.selectedOption === -1 ? "⏱️ Timeout! Time ran out." : (OUTPUT_PREDICTOR_QUESTIONS[gameState.currentQuestionIndex].options[gameState.selectedOption] === OUTPUT_PREDICTOR_QUESTIONS[gameState.currentQuestionIndex].correctOption ? "✓ Correct Output predicted!" : "✗ Incorrect prediction!")}



</div>



<p style={{ margin: 0, fontSize: '0.95rem' }}>



<strong>Explanation: </strong>



{OUTPUT_PREDICTOR_QUESTIONS[gameState.currentQuestionIndex].explanation}



</p>



</div>



)}



</>



)}



</div>



)}



{/* Game 3: Code Sprint Play Zone */}



{activeGame === 'code-sprint' && (



<div className="ph-play-zone">



<div className="ph-play-header">



<div className="ph-play-title-wrap">



<span className="ph-play-icon">⚡</span>



<h2>Code Sprint {gameState.showResults ? <span className="ph-desktop-results-title"> - Results</span> : <span className="ph-play-sub-title">Question {gameState.currentQuestionIndex + 1} of {CODE_SPRINT_QUESTIONS.length}</span>}</h2>



</div>



<button className="ph-btn-back" onClick={backToMenu}>✕ <span className="ph-btn-back-text">Quit Game</span></button>



</div>



{gameState.showResults ? (



<div className="ph-results-screen">



<div className="ph-results-trophy">⚡</div>



<h2>Workout Scorecard</h2>



<p>Detailed performance analytics for this run:</p>



<div className="ph-results-grid">



<div className="ph-results-stat">



<span className="ph-results-stat-val">{gameState.correctCount}/{CODE_SPRINT_QUESTIONS.length}</span>



<div>Correct Sprint Hits</div>



</div>



<div className="ph-results-stat">



<span className="ph-results-stat-val">{Math.round((gameState.correctCount / CODE_SPRINT_QUESTIONS.length) * 100)}%</span>



<div>Accuracy</div>



</div>



<div className="ph-results-stat">



<span className="ph-results-stat-val">{gameState.totalTimeSpent}s</span>



<div>Total Time Taken</div>



</div>



<div className="ph-results-stat">



<span className="ph-results-stat-val">{getRating(gameState.correctCount, CODE_SPRINT_QUESTIONS.length)}</span>



<div>Rank Earned</div>



</div>



</div>



<div style={{ marginTop: '1.5rem', fontWeight: '700' }}>



Personal Best: {highScores['code-sprint']}/{CODE_SPRINT_QUESTIONS.length}



</div>



<button className="ph-btn-primary ph-btn-scorecard-quit" onClick={backToMenu}>Quit to Hub</button>



</div>



) : (



<>



<div style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '1rem', lineHeight: '1.5' }}>



Task: {CODE_SPRINT_QUESTIONS[gameState.currentQuestionIndex].title}



</div>



<div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>


<div className="ph-timer-bar-container" style={{ flexGrow: 1, marginBottom: 0 }}>


<div


className={`ph-timer-bar-fill ${gameState.timerLeft <= 5 ? 'warning' : ''}`}


style={{ width: `${(gameState.timerLeft / CODE_SPRINT_QUESTIONS[gameState.currentQuestionIndex].timeLimit) * 100}%` }}


/>


</div>


<span style={{ color: gameState.timerLeft <= 5 ? 'var(--ph-danger)' : 'var(--ph-text)', fontWeight: '800', whiteSpace: 'nowrap', flexShrink: 0, fontSize: '0.9rem' }}>


⏱️ {gameState.timerLeft}s


</span>


{gameState.isAnswered && (


<button className="ph-btn-primary" onClick={() => nextQuestion('code-sprint')} style={{ margin: 0 }}>


{gameState.currentQuestionIndex + 1 === CODE_SPRINT_QUESTIONS.length ? "Finish" : "Next"}


</button>


)}


</div>



<div className="ph-options-grid" style={{ marginTop: '1.5rem' }}>



{CODE_SPRINT_QUESTIONS[gameState.currentQuestionIndex].options.map((opt, idx) => {



const isCorrect = idx === CODE_SPRINT_QUESTIONS[gameState.currentQuestionIndex].correctIndex;



const isSelected = gameState.selectedOption === idx;



let btnClass = "";



if (gameState.isAnswered) {



if (isCorrect) btnClass = "correct";



else if (isSelected) btnClass = "incorrect";



}



return (



<button



key={idx}



className={`ph-option-btn ${btnClass}`}



onClick={() => selectOptionGame(idx, 'code-sprint')}



disabled={gameState.isAnswered}



style={{ fontFamily: 'Fira Code, monospace', fontSize: '0.9rem' }}



>



<span>{opt}</span>



<span className="ph-option-marker">



{gameState.isAnswered && isCorrect ? "✓" : gameState.isAnswered && isSelected ? "✗" : String.fromCharCode(65 + idx)}



</span>



</button>



);



})}



</div>



{gameState.isAnswered && (



<div style={{ margin: '1.5rem 0', padding: '1rem', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid var(--ph-info)' }}>



<div className="ph-feedback-text" style={{ color: gameState.selectedOption === -1 ? 'var(--ph-danger)' : (gameState.selectedOption === CODE_SPRINT_QUESTIONS[gameState.currentQuestionIndex].correctIndex ? 'var(--ph-success)' : 'var(--ph-danger)'), marginBottom: '0.5rem', fontWeight: '700' }}>



{gameState.selectedOption === -1 ? "⏱️ Timeout! Time ran out." : (gameState.selectedOption === CODE_SPRINT_QUESTIONS[gameState.currentQuestionIndex].correctIndex ? "✓ Correct Sprint Answer!" : "✗ Incorrect answer!")}



</div>



<p style={{ margin: 0, fontSize: '0.95rem' }}>



<strong>Explanation: </strong>



{CODE_SPRINT_QUESTIONS[gameState.currentQuestionIndex].explanation}



</p>



</div>



)}



</>



)}



</div>



)}



{/* Game 4: SQL Detective Play Zone */}



{activeGame === 'sql-detective' && (



<div className="ph-play-zone">



<div className="ph-play-header">



<div className="ph-play-title-wrap">



<span className="ph-play-icon">🕵️</span>



<h2>SQL Detective {gameState.showResults ? <span className="ph-desktop-results-title"> - Results</span> : <span className="ph-play-sub-title">Question {gameState.currentQuestionIndex + 1} of {SQL_DETECTIVE_QUESTIONS.length}</span>}</h2>



</div>



<button className="ph-btn-back" onClick={backToMenu}>✕ <span className="ph-btn-back-text">Quit Game</span></button>



</div>



{gameState.showResults ? (



<div className="ph-results-screen">



<div className="ph-results-trophy">🏆</div>



<h2>Workout Scorecard</h2>



<p>Detailed performance analytics for this run:</p>



<div className="ph-results-grid">



<div className="ph-results-stat">



<span className="ph-results-stat-val">{gameState.correctCount}/{SQL_DETECTIVE_QUESTIONS.length}</span>



<div>Correct Queries</div>



</div>



<div className="ph-results-stat">



<span className="ph-results-stat-val">{Math.round((gameState.correctCount / SQL_DETECTIVE_QUESTIONS.length) * 100)}%</span>



<div>Accuracy</div>



</div>



<div className="ph-results-stat">



<span className="ph-results-stat-val">{gameState.totalTimeSpent}s</span>



<div>Total Time Taken</div>



</div>



<div className="ph-results-stat">



<span className="ph-results-stat-val">{getRating(gameState.correctCount, SQL_DETECTIVE_QUESTIONS.length)}</span>



<div>Rank Earned</div>



</div>



</div>



<div style={{ marginTop: '1.5rem', fontWeight: '700' }}>



Personal Best: {highScores['sql-detective']}/{SQL_DETECTIVE_QUESTIONS.length}



</div>



<button className="ph-btn-primary ph-btn-scorecard-quit" onClick={backToMenu}>Quit to Hub</button>



</div>



) : (



<>



<div style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '1rem', lineHeight: '1.5' }}>


SQL Schema Case:


</div>


<div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>


<div className="ph-timer-bar-container" style={{ flexGrow: 1, marginBottom: 0 }}>


<div


className={`ph-timer-bar-fill ${gameState.timerLeft <= 8 ? 'warning' : ''}`}


style={{ width: `${(gameState.timerLeft / SQL_DETECTIVE_QUESTIONS[gameState.currentQuestionIndex].timeLimit) * 100}%` }}


/>


</div>


<span style={{ color: gameState.timerLeft <= 8 ? 'var(--ph-danger)' : 'var(--ph-text)', fontWeight: '800', whiteSpace: 'nowrap', flexShrink: 0, fontSize: '0.9rem' }}>


⏱️ {gameState.timerLeft}s


</span>


{gameState.isAnswered && (


<button className="ph-btn-primary" onClick={() => nextQuestion('sql-detective')} style={{ margin: 0 }}>


{gameState.currentQuestionIndex + 1 === SQL_DETECTIVE_QUESTIONS.length ? "Finish" : "Next"}


</button>


)}


</div>



<div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid var(--ph-info)', margin: '1.5rem 0' }}>



<div style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--ph-text-muted)', marginBottom: '0.25rem' }}>Schema Context</div>



<div style={{ fontFamily: 'monospace', fontWeight: '600' }}>{SQL_DETECTIVE_QUESTIONS[gameState.currentQuestionIndex].schema}</div>



<div style={{ marginTop: '0.5rem', fontWeight: '700' }}>Task: {SQL_DETECTIVE_QUESTIONS[gameState.currentQuestionIndex].task}</div>



</div>



<div className="ph-options-grid">



{SQL_DETECTIVE_QUESTIONS[gameState.currentQuestionIndex].options.map((opt, idx) => {



const isCorrect = idx === SQL_DETECTIVE_QUESTIONS[gameState.currentQuestionIndex].correctIndex;



const isSelected = gameState.selectedOption === idx;



let btnClass = "";



if (gameState.isAnswered) {



if (isCorrect) btnClass = "correct";



else if (isSelected) btnClass = "incorrect";



}



return (



<button



key={idx}



className={`ph-option-btn ${btnClass}`}



onClick={() => selectOptionGame(idx, 'sql-detective')}



disabled={gameState.isAnswered}



style={{ fontFamily: 'Fira Code, monospace', fontSize: '0.9rem' }}



>



<span>{opt}</span>



<span className="ph-option-marker">



{gameState.isAnswered && isCorrect ? "✓" : gameState.isAnswered && isSelected ? "✗" : String.fromCharCode(65 + idx)}



</span>



</button>



);



})}



</div>



{gameState.isAnswered && (



<div style={{ margin: '1.5rem 0', padding: '1rem', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid var(--ph-info)' }}>



<div className="ph-feedback-text" style={{ color: gameState.selectedOption === -1 ? 'var(--ph-danger)' : (gameState.selectedOption === SQL_DETECTIVE_QUESTIONS[gameState.currentQuestionIndex].correctIndex ? 'var(--ph-success)' : 'var(--ph-danger)'), marginBottom: '0.5rem', fontWeight: '700' }}>



{gameState.selectedOption === -1 ? "⏱️ Timeout! Time ran out." : (gameState.selectedOption === SQL_DETECTIVE_QUESTIONS[gameState.currentQuestionIndex].correctIndex ? "✓ Correct SQL query selected!" : "✗ That was not the correct query!")}



</div>



<p style={{ margin: 0, fontSize: '0.95rem' }}>



<strong>Explanation: </strong>



{SQL_DETECTIVE_QUESTIONS[gameState.currentQuestionIndex].explanation}



</p>



</div>



)}



</>



)}



</div>



)}



{/* Game 5: Error Fix Play Zone */}



{activeGame === 'error-fix' && (



<div className="ph-play-zone">



<div className="ph-play-header">



<div className="ph-play-title-wrap">



<span className="ph-play-icon">🛠️</span>



<h2>Error Fix Challenge {gameState.showResults ? <span className="ph-desktop-results-title"> - Results</span> : <span className="ph-play-sub-title">Question {gameState.currentQuestionIndex + 1} of {ERROR_FIX_QUESTIONS.length}</span>}</h2>



</div>



<button className="ph-btn-back" onClick={backToMenu}>✕ <span className="ph-btn-back-text">Quit Game</span></button>



</div>



{gameState.showResults ? (



<div className="ph-results-screen">



<div className="ph-results-trophy">🏆</div>



<h2>Workout Scorecard</h2>



<p>Detailed performance analytics for this run:</p>



<div className="ph-results-grid">



<div className="ph-results-stat">



<span className="ph-results-stat-val">{gameState.correctCount}/{ERROR_FIX_QUESTIONS.length}</span>



<div>Fixed Correctly</div>



</div>



<div className="ph-results-stat">



<span className="ph-results-stat-val">{Math.round((gameState.correctCount / ERROR_FIX_QUESTIONS.length) * 100)}%</span>



<div>Accuracy</div>



</div>



<div className="ph-results-stat">



<span className="ph-results-stat-val">{gameState.totalTimeSpent}s</span>



<div>Total Time Taken</div>



</div>



<div className="ph-results-stat">



<span className="ph-results-stat-val">{getRating(gameState.correctCount, ERROR_FIX_QUESTIONS.length)}</span>



<div>Rank Earned</div>



</div>



</div>



<div style={{ marginTop: '1.5rem', fontWeight: '700' }}>



Personal Best: {highScores['error-fix']}/{ERROR_FIX_QUESTIONS.length}



</div>



<button className="ph-btn-primary ph-btn-scorecard-quit" onClick={backToMenu}>Quit to Hub</button>



</div>



) : (



<>



<div style={{ fontWeight: '600', fontSize: '1.05rem', marginBottom: '1rem', lineHeight: '1.5' }}>


{ERROR_FIX_QUESTIONS[gameState.currentQuestionIndex].description}


</div>


<div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>


<div className="ph-timer-bar-container" style={{ flexGrow: 1, marginBottom: 0 }}>


<div


className={`ph-timer-bar-fill ${gameState.timerLeft <= 7 ? 'warning' : ''}`}


style={{ width: `${(gameState.timerLeft / ERROR_FIX_QUESTIONS[gameState.currentQuestionIndex].timeLimit) * 100}%` }}


/>


</div>


<span style={{ color: gameState.timerLeft <= 7 ? 'var(--ph-danger)' : 'var(--ph-text)', fontWeight: '800', whiteSpace: 'nowrap', flexShrink: 0, fontSize: '0.9rem' }}>


⏱️ {gameState.timerLeft}s


</span>


{gameState.isAnswered && (


<button className="ph-btn-primary" onClick={() => nextQuestion('error-fix')} style={{ margin: 0 }}>


{gameState.currentQuestionIndex + 1 === ERROR_FIX_QUESTIONS.length ? "Finish" : "Next"}


</button>


)}


</div>



<div className="ph-code-container" style={{ marginTop: '1.5rem' }}>



<code>{ERROR_FIX_QUESTIONS[gameState.currentQuestionIndex].codeSnippet}</code>



</div>



<div className="ph-options-grid">



{ERROR_FIX_QUESTIONS[gameState.currentQuestionIndex].options.map((opt, idx) => {



const isCorrect = idx === ERROR_FIX_QUESTIONS[gameState.currentQuestionIndex].correctIndex;



const isSelected = gameState.selectedOption === idx;



let btnClass = "";



if (gameState.isAnswered) {



if (isCorrect) btnClass = "correct";



else if (isSelected) btnClass = "incorrect";



}



return (



<button



key={idx}



className={`ph-option-btn ${btnClass}`}



onClick={() => selectOptionGame(idx, 'error-fix')}



disabled={gameState.isAnswered}



style={{ fontFamily: 'Fira Code, monospace', fontSize: '0.9rem' }}



>



<span>{opt}</span>



<span className="ph-option-marker">



{gameState.isAnswered && isCorrect ? "✓" : gameState.isAnswered && isSelected ? "✗" : String.fromCharCode(65 + idx)}



</span>



</button>



);



})}



</div>



{gameState.isAnswered && (



<div style={{ margin: '1.5rem 0', padding: '1rem', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid var(--ph-info)' }}>



<div className="ph-feedback-text" style={{ color: gameState.selectedOption === -1 ? 'var(--ph-danger)' : (gameState.selectedOption === ERROR_FIX_QUESTIONS[gameState.currentQuestionIndex].correctIndex ? 'var(--ph-success)' : 'var(--ph-danger)'), marginBottom: '0.5rem', fontWeight: '700' }}>



{gameState.selectedOption === -1 ? "⏱️ Timeout! Time ran out." : (gameState.selectedOption === ERROR_FIX_QUESTIONS[gameState.currentQuestionIndex].correctIndex ? "✓ Correct Patch selected!" : "✗ That patch doesn't fix the bug!")}



</div>



<p style={{ margin: 0, fontSize: '0.95rem' }}>



<strong>Explanation: </strong>



{ERROR_FIX_QUESTIONS[gameState.currentQuestionIndex].explanation}



</p>



</div>



)}



</>



)}



</div>



)}



{/* Game 6: Zip Puzzle Play Zone */}



{activeGame === 'zip' && (() => {



const level = ZIP_LEVEL;



return (



<div className="ph-play-zone">



<div className="ph-play-header">



<div className="ph-play-title-wrap">



<span className="ph-play-icon">🔗</span>



<h2>Zip Puzzle Challenge</h2>



</div>



<button className="ph-btn-back" onClick={backToMenu}>✕ <span className="ph-btn-back-text">Quit Game</span></button>



</div>



<div className="zip-goal-timer-wrapper">



<span className="zip-goal-text">



{zipWin ? "🎉 Puzzle Solved!" : "Goal: Connect 1 to 8 sequentially and fill every cell!"}



</span>



<span className="zip-timer-text">



⏱️ {formatTime(zipTime)}



</span>



</div>



<div style={{ position: 'relative' }}>



<div className="zip-grid-container" style={{ display: 'flex', justifyContent: 'center', margin: '1.5rem 0' }}>



<div



className="zip-grid"



onTouchMove={(e) => handleTouchMove(e, level)}



onTouchEnd={() => setIsDrawing(false)}



style={{



display: 'grid',



gridTemplateColumns: `repeat(${level.cols}, var(--zip-cell-size, 60px))`,



gridTemplateRows: `repeat(${level.rows}, var(--zip-cell-size, 60px))`,



'--zip-cell-size': '60px',



gap: '0px',



background: '#e2e8f0',



padding: '8px',



borderRadius: '16px',



boxShadow: '0 4px 12px rgba(0,0,0,0.05)',



opacity: zipWin ? 0.65 : 1,



transition: 'opacity 0.3s'



}}



>



{Array.from({ length: level.rows }).map((_, r) => (



Array.from({ length: level.cols }).map((_, c) => {



const numVal = level.numbers[`${r},${c}`];



const conn = getPathConnections(r, c);



const isPath = conn.pairIdx !== -1;



const activePath = zipPaths[activePair];



const isHead = activePath && activePath.length > 0 && activePath[activePath.length - 1][0] === r && activePath[activePath.length - 1][1] === c;



// Border/wall checks (match 0-indexed walls key format)



const borderRight = level.walls[`V:${r},${c}`] ? '4px solid #0f172a' : '1px solid #cbd5e1';



const borderBottom = level.walls[`H:${r},${c}`] ? '4px solid #0f172a' : '1px solid #cbd5e1';



const cellBg = isPath ? `${conn.color}22` : '#ffffff';



const activeStyle = {



width: 'var(--zip-cell-size, 60px)',



height: 'var(--zip-cell-size, 60px)',



position: 'relative',



'--segment-color': conn.color || '#2563eb'



};



return (



<div



key={`${r}-${c}`}



className={`zip-cell ${isPath ? 'path-cell' : ''} ${isHead ? 'head-cell' : ''}`}



style={activeStyle}



data-row={r}



data-col={c}



onMouseDown={(e) => { e.preventDefault(); handleDragStart(r, c, level); }}



onMouseEnter={() => handleDragMove(r, c, level)}



onTouchStart={(e) => { if (e.cancelable) e.preventDefault(); handleDragStart(r, c, level); }}



>



{/* Clean cell background overlay */}



<div



className="zip-cell-bg"



style={{



position: 'absolute',



top: 0,



left: 0,



right: 0,



bottom: 0,



background: cellBg,



zIndex: 1



}}



/>



{isPath && (



<div className="zip-path-dot" />



)}



{numVal && (



<div className="zip-number-circle" style={{ background: SEGMENT_COLORS[Math.floor((numVal - 1) / 2) % SEGMENT_COLORS.length], color: '#ffffff', zIndex: 10 }}>



{numVal}



</div>



)}



{conn.top && <div className="zip-line zip-line-top" />}



{conn.bottom && <div className="zip-line zip-line-bottom" />}



{conn.left && <div className="zip-line zip-line-left" />}



{conn.right && <div className="zip-line zip-line-right" />}



{/* Cell borders and walls overlay on top of the paths */}



<div



className="zip-cell-borders"



style={{



position: 'absolute',



top: 0,



left: 0,



right: 0,



bottom: 0,



borderTop: r === 0 ? '1px solid #cbd5e1' : undefined,



borderLeft: c === 0 ? '1px solid #cbd5e1' : undefined,



borderRight: borderRight,



borderBottom: borderBottom,



pointerEvents: 'none',



zIndex: 5



}}



/>



</div>



);



})



))}



</div>



</div>



{zipWin && (



<div style={{



position: 'absolute',



top: 0,



left: 0,



right: 0,



bottom: 0,



background: 'rgba(255, 255, 255, 0.85)',



backdropFilter: 'blur(3px)',



display: 'flex',



flexDirection: 'column',



alignItems: 'center',



justifyContent: 'center',



borderRadius: '16px',



zIndex: 50,



padding: '2rem',



textAlign: 'center',



boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)'



}}>



<div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏆</div>



<h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--ph-text)', marginBottom: '0.5rem' }}>Puzzle Solved!</h2>



<p style={{ color: '#64748b', marginBottom: '1.5rem', fontWeight: '500' }}>You connected all zip links in order and filled the entire grid!</p>



<div className="ph-results-grid" style={{ marginBottom: '2rem', width: '100%', maxWidth: '300px' }}>



<div className="ph-results-stat">



<span className="ph-results-stat-val">+{level.xp} XP</span>



<div>XP Reward</div>



</div>



<div className="ph-results-stat">



<span className="ph-results-stat-val">{formatTime(zipTime)}</span>



<div>Clear Time</div>



</div>



</div>



<button className="ph-btn-primary ph-btn-scorecard-quit" onClick={backToMenu} style={{ marginTop: 0 }}>



Back to Hub



</button>



</div>



)}



</div>



<div className="zip-controls" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>



<button



className={`zip-btn ${zipHistory.length === 0 || zipWin ? 'disabled' : ''}`}



onClick={handleZipUndo}



disabled={zipHistory.length === 0 || zipWin}



style={{ minWidth: '130px' }}



>



↩ Undo<span className="zip-btn-extra-text"> Step</span>



</button>



<button className="zip-btn" onClick={handleZipReset} style={{ minWidth: '130px' }} disabled={zipWin}>



🔄 Reset<span className="zip-btn-extra-text"> Board</span>



</button>



<button
  className={`zip-btn ${zipWin || hintCooldown > 0 ? 'disabled' : ''}`}
  onClick={() => handleZipHint(level)}
  style={{ minWidth: '130px' }}
  disabled={zipWin || hintCooldown > 0}
>
  💡 {hintCooldown > 0 ? `Hint (${hintCooldown}s)` : "Get Hint"}
</button>



</div>



<div className="zip-how-to-play">



<div className="zip-how-title">🎮 How to Play</div>



<div className="zip-how-grid">



<div className="zip-how-item">



<span className="zip-how-icon">1️⃣</span>



<div className="zip-how-text-group">



<div style={{ fontWeight: '700', color: 'var(--ph-text)' }}>Draw Path</div>



<span className="zip-how-text">Connect all numbers in order (1 → 2 → 3 → 4 → 5 → 6 → 7 → 8) in a single continuous line. Click/drag starting from 1.</span>



</div>



</div>



<div className="zip-how-item">



<span className="zip-how-icon">🟪</span>



<div className="zip-how-text-group">



<div style={{ fontWeight: '700', color: 'var(--ph-text)' }}>Fill the Grid</div>



<span className="zip-how-text">Your path must pass through every single cell in the grid exactly once.</span>



</div>



</div>



<div className="zip-how-item">



<span className="zip-how-icon">🚧</span>



<div className="zip-how-text-group">



<div style={{ fontWeight: '700', color: 'var(--ph-text)' }}>Avoid Barriers</div>



<span className="zip-how-text">Do not cross any thick black walls between cells.</span>



</div>



</div>



</div>



</div>



</div>



);



})()}



{/* Tab 2: MCQ Battle Arena Mode Selection */}



{activeTab === 'mcq-battle' && (



<div className="ph-modes-section">



<div className="ph-quiz-modes-grid">



<div className="ph-mode-card" onClick={() => startGame('daily-quiz')}>



<span className="ph-mode-badge daily">Daily Boost</span>



<h3>Daily Quiz Challenge</h3>



<p>Answer a daily topic question. Refreshes daily at 12:10 AM. Includes a 30s timer & 2X XP bonus.</p>



<div className="ph-personal-best">Best score: {highScores['daily-quiz']}/{getQuestionsList('daily-quiz').length}</div>



</div>



<div className="ph-mode-card" onClick={() => setMcqMode('battle')}>



<span className="ph-mode-badge battle">1v1 PvP</span>



<h3>1v1 Battle Arena</h3>



<p>Fight in real-time against placement_wizard. You have 20s to lock-in each strike, or opponent strikes you automatically!</p>



</div>



<div className="ph-mode-card" onClick={() => startGame('company-quiz')}>



<span className="ph-mode-badge company">MNC & Product</span>



<h3>Company Specific Quiz</h3>



<p>Select MNC, Product Based, or Startup Level to test real historical questions with a 30s timer.</p>



<div className="ph-personal-best">Best score: {highScores['company-quiz']}/2</div>



</div>



</div>



</div>



)}



{/* MCQ Mode: Daily Quiz Play Zone */}



{activeGame === 'daily-quiz' && (



<div className="ph-play-zone">



<div className="ph-play-header">



<div className="ph-play-title-wrap">



<span className="ph-play-icon">🧠</span>



<h2>Daily Quiz {gameState.showResults && <span className="ph-desktop-results-title"> - Results</span>}</h2>



</div>



<button className="ph-btn-back" onClick={backToMenu}>✕ <span className="ph-btn-back-text">Quit Quiz</span></button>



</div>



{gameState.showResults ? (



<div className="ph-results-screen">



<div className="ph-results-trophy">🌟</div>



<h2>Daily Quiz Scorecard</h2>



<div className="ph-results-grid">



<div className="ph-results-stat">



<span className="ph-results-stat-val">{gameState.correctCount}/{getQuestionsList('daily-quiz').length}</span>



<div>Correct Answers</div>



</div>



<div className="ph-results-stat">



<span className="ph-results-stat-val">{Math.round((gameState.correctCount / getQuestionsList('daily-quiz').length) * 100)}%</span>



<div>Accuracy</div>



</div>



<div className="ph-results-stat">



<span className="ph-results-stat-val">+{gameState.correctCount * 30} XP</span>



<div>Double Multiplier XP</div>



</div>



</div>



<button className="ph-btn-primary ph-btn-scorecard-quit" onClick={backToMenu}>Quit to Arena</button>



</div>



) : (



<>



{/* Topic selection list */}



<div className="ph-quiz-topics-wrapper">



<h4>Select Quiz Topic:</h4>



<div className="ph-topics-grid">



{[



{ id: 'java', label: 'Java', icon: '☕' },



{ id: 'python', label: 'Python', icon: '🐍' },



{ id: 'dbms', label: 'DBMS', icon: '🗄️' },



{ id: 'os', label: 'OS', icon: '🖥️' },



{ id: 'cn', label: 'Comp Networks', icon: '🌐' },



{ id: 'oops', label: 'OOPs', icon: '🧩' },



{ id: 'aptitude', label: 'Aptitude', icon: '🧮' }



].map(topic => (



<button



key={topic.id}



className={`ph-topic-select-btn ${mcqTopic === topic.id ? 'active' : ''}`}



onClick={() => {



setMcqTopic(topic.id);



setGameState(prev => ({



...prev,



currentQuestionIndex: 0,



selectedOption: null,



isAnswered: false,



correctCount: 0,



timerLeft: 30



}));



}}



>



<span className="ph-topic-icon">{topic.icon}</span>



<span>{topic.label}</span>



</button>



))}



</div>



</div>



{/* Timer display */}



<div className="ph-quiz-arena-title">



Challenge Arena:



</div>



<div className="ph-quiz-timer-wrapper">


<div className="ph-timer-bar-container" style={{ flexGrow: 1, marginBottom: 0 }}>


<div


className={`ph-timer-bar-fill ${gameState.timerLeft <= 6 ? 'warning' : ''}`}


style={{ width: `${(gameState.timerLeft / 30) * 100}%` }}


/>


</div>


<span style={{ color: gameState.timerLeft <= 6 ? 'var(--ph-danger)' : 'var(--ph-text)', fontWeight: '800', whiteSpace: 'nowrap', flexShrink: 0, fontSize: '0.9rem' }}>


⏱️ {gameState.timerLeft}s


</span>


{gameState.isAnswered && (


<button className="ph-btn-primary" onClick={() => nextQuestion('daily-quiz')} style={{ margin: 0 }}>


{gameState.currentQuestionIndex + 1 === MCQ_QUESTIONS[mcqTopic].length ? "Finish" : "Next"}


</button>


)}


</div>



{/* Question Card */}



<div className="ph-quiz-question-card">



<h3 className="ph-quiz-question-title">



Q{gameState.currentQuestionIndex + 1}: {MCQ_QUESTIONS[mcqTopic][gameState.currentQuestionIndex].q}



</h3>



<div className="ph-options-grid" style={{ gridTemplateColumns: '1fr' }}>



{MCQ_QUESTIONS[mcqTopic][gameState.currentQuestionIndex].a.map((opt, idx) => {



const isCorrect = idx === MCQ_QUESTIONS[mcqTopic][gameState.currentQuestionIndex].c;



const isSelected = gameState.selectedOption === idx;



let btnClass = "";



if (gameState.isAnswered) {



if (isCorrect) btnClass = "correct";



else if (isSelected) btnClass = "incorrect";



}



return (



<button



key={idx}



className={`ph-option-btn ${btnClass}`}



onClick={() => selectOptionGame(idx, 'daily-quiz')}



disabled={gameState.isAnswered}



>



<span>{opt}</span>



<span className="ph-option-marker">



{gameState.isAnswered && isCorrect ? "✓" : gameState.isAnswered && isSelected ? "✗" : String.fromCharCode(65 + idx)}



</span>



</button>



);



})}



</div>



</div>







</>



)}



</div>



)}



{/* MCQ Mode: 1v1 PvP Arena Play Zone */}



{activeTab === 'mcq-battle' && mcqMode === 'battle' && (



<div className="ph-play-zone" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>



<div className="ph-play-header" style={{ borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>



<div className="ph-play-title-wrap">



<span className="ph-play-icon">⚔️</span>



<h2 style={{ color: '#ffffff', margin: 0 }}>1v1 Arena</h2>



</div>



<button className="ph-btn-back" style={{ background: '#1e293b', color: '#ffffff', flexShrink: 0 }} onClick={backToMenu}>✕ <span className="ph-btn-back-text">Flee Battle</span></button>



</div>



{/* Battle HUD */}



<div className="ph-battle-arena">



<div className="ph-battle-player">



<div className="ph-battle-avatar">🧙</div>



<div className="ph-battle-name">You</div>



<div className="ph-battle-hp-bar">



<div className={`ph-battle-hp-fill ${battleState.playerHp <= 30 ? 'danger' : ''}`} style={{ width: `${battleState.playerHp}%` }} />



</div>



<div style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.8rem' }}>{battleState.playerHp} / 100 HP</div>



</div>



<div className="ph-battle-timer-widget">



<div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '800' }}>Strike Timer</div>



<div style={{ fontSize: '1.5rem', fontWeight: '900', color: battleTimer <= 5 ? '#ef4444' : '#e2e8f0', lineHeight: '1.2' }}>{battleTimer}s</div>



</div>



<div className="ph-battle-player opponent">



<div className="ph-battle-avatar">👾</div>



<div className="ph-battle-name">placement_wizard</div>



<div className="ph-battle-hp-bar">



<div className={`ph-battle-hp-fill ${battleState.opponentHp <= 30 ? 'danger' : ''}`} style={{ width: `${battleState.opponentHp}%` }} />



</div>



<div style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.8rem' }}>{battleState.opponentHp} / 100 HP</div>



</div>



</div>



<div style={{ background: '#1e293b', padding: '1rem', borderRadius: '12px', color: '#f8fafc', marginBottom: '2rem', textAlign: 'center', fontWeight: '700', fontSize: '1rem', borderLeft: '4px solid var(--ph-info)' }}>



{battleState.battleLog}



</div>



{battleState.battleOver ? (



<div className="ph-results-screen" style={{ color: '#ffffff' }}>



<div className="ph-results-trophy" style={{ fontSize: '5rem' }}>{battleState.win ? "👑" : "💀"}</div>



<h2>{battleState.win ? "BATTLE WON!" : "DEFEAT!"}</h2>



<p>{battleState.win ? "You defeated placement_wizard with clean execution." : "Opponent was too fast. Play more quizzes to sharpen up!"}</p>



<button className="ph-btn-primary ph-btn-scorecard-quit" onClick={backToMenu}>Back to Arena</button>



</div>



) : (



<>



<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
  {/* Topic Selection Dropdown */}
  <div className="ph-header-topic-select" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '700', whiteSpace: 'nowrap' }}>Topic:</span>
    <div className="ph-custom-select-container">
      <button 
          className="ph-custom-select-trigger" 
          onClick={() => setIsTopicDropdownOpen(!isTopicDropdownOpen)}
          style={{ minWidth: '150px', padding: '0.35rem 0.75rem', fontSize: '0.85rem', borderRadius: '8px' }}
      >
          <span className="ph-custom-select-selected-icon">
              {COMBAT_TOPICS.find(t => t.id === mcqTopic)?.icon || '☕'}
          </span>
          <span className="ph-custom-select-selected-label">
              {COMBAT_TOPICS.find(t => t.id === mcqTopic)?.label || 'Java Programming'}
          </span>
          <span className={`ph-custom-select-arrow ${isTopicDropdownOpen ? 'open' : ''}`}>▼</span>
      </button>
      {isTopicDropdownOpen && (
          <>
              <div className="ph-custom-select-backdrop" onClick={() => setIsTopicDropdownOpen(false)} />
              <div className="ph-custom-select-options" style={{ minWidth: '200px', borderRadius: '10px' }}>
                  {COMBAT_TOPICS.map(topic => (
                      <div
                          key={topic.id}
                          className={`ph-custom-select-option ${mcqTopic === topic.id ? 'active' : ''}`}
                          onClick={() => {
                              setMcqTopic(topic.id);
                              setIsTopicDropdownOpen(false);
                          }}
                      >
                          <span className="ph-custom-select-option-icon">{topic.icon}</span>
                          <span className="ph-custom-select-option-label">{topic.label}</span>
                          {mcqTopic === topic.id && <span className="ph-custom-select-option-check">✓</span>}
                      </div>
                  ))}
              </div>
          </>
      )}
    </div>
  </div>

  {/* Next Button */}
  {battleState.isAnswered ? (
      <button className="ph-btn-primary" onClick={() => nextBattleQuestion(MCQ_QUESTIONS[mcqTopic])} style={{ margin: 0 }}>
          Next
      </button>
  ) : (
      <div />
  )}
</div>

{/* Question Display Card */}



<div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '16px', border: '1px solid #334155', marginBottom: '2rem' }}>



<h3 style={{ margin: '0 0 1.5rem 0', color: '#ffffff' }}>



Attack {battleState.currentQIndex + 1}: {MCQ_QUESTIONS[mcqTopic][battleState.currentQIndex].q}



</h3>



<div className="ph-options-grid">



{MCQ_QUESTIONS[mcqTopic][battleState.currentQIndex].a.map((opt, idx) => {
const isCorrect = idx === MCQ_QUESTIONS[mcqTopic][battleState.currentQIndex].c;
const isSelected = battleState.selectedOption === idx;
let btnClass = "";
let btnStyle = { background: '#0f172a', border: '1px solid #334155', color: '#f8fafc' };
let markerStyle = { border: '2px solid #475569' };

if (battleState.isAnswered) {
  if (isCorrect) {
    btnClass = "correct";
    btnStyle = { background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--ph-success)', color: 'var(--ph-success)' };
    markerStyle = { border: '2px solid var(--ph-success)', color: 'var(--ph-success)' };
  } else if (isSelected) {
    btnClass = "incorrect";
    btnStyle = { background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--ph-danger)', color: 'var(--ph-danger)' };
    markerStyle = { border: '2px solid var(--ph-danger)', color: 'var(--ph-danger)' };
  }
}

return (
<button
key={idx}
className={`ph-option-btn ${btnClass}`}
style={btnStyle}
onClick={() => handleBattleMcqAnswer(idx, MCQ_QUESTIONS[mcqTopic])}
disabled={battleState.isAnswered}
>
<span>{opt}</span>
<span className="ph-option-marker" style={markerStyle}>
{battleState.isAnswered && isCorrect ? "✓" : battleState.isAnswered && isSelected ? "✗" : String.fromCharCode(65 + idx)}
</span>
</button>
);
})}



</div>



</div>



</>



)}



</div>



)}



{/* MCQ Mode: Company Specific Quiz Play Zone */}



{activeGame === 'company-quiz' && (



<div className="ph-play-zone">



<div className="ph-play-header">



<div className="ph-play-title-wrap">



<span className="ph-play-icon">🏢</span>



<h2 style={{ fontSize: '1.25rem' }}>{gameState.showResults ? "Company placement Archives - Results" : "Company placement Archives"}</h2>



</div>



<button className="ph-btn-back" onClick={backToMenu}>✕ <span className="ph-btn-back-text">Quit Workout</span></button>



</div>



{gameState.showResults ? (



<div className="ph-results-screen">



<div className="ph-results-trophy">🏆</div>



<h2>Corporate Placement Quiz Complete!</h2>



<p>Cracking past papers increases placement chances by 80%.</p>



<div className="ph-results-grid">



<div className="ph-results-stat">



<span className="ph-results-stat-val">{gameState.correctCount}/{getQuestionsList('company-quiz').length}</span>



<div>Correct Hits</div>



</div>



<div className="ph-results-stat">



<span className="ph-results-stat-val">{Math.round((gameState.correctCount / getQuestionsList('company-quiz').length) * 100)}%</span>



<div>Accuracy</div>



</div>



<div className="ph-results-stat">



<span className="ph-results-stat-val">+{gameState.correctCount * 15} XP</span>



<div>XP Gained</div>



</div>



</div>



<button className="ph-btn-primary ph-btn-scorecard-quit" onClick={backToMenu}>Back to Arena</button>



</div>



) : (



<>



{/* Current Target Indicator */}



<div style={{



  display: 'flex',



  alignItems: 'center',



  gap: '0.75rem',



  background: 'rgba(124, 58, 237, 0.08)',



  border: '1px dashed var(--ph-primary)',



  padding: '0.75rem 1rem',



  borderRadius: '12px',



  marginBottom: '1.5rem',



  fontWeight: '700'



}}>



  <span style={{ fontSize: '1.25rem' }}>🎯</span>



  <span style={{ color: 'var(--ph-text)' }}>



    {"Target Question for: " + (



      gameState.currentQuestionIndex === 0 ? "MNC" :



      gameState.currentQuestionIndex === 1 ? "Product Based" :



      "Startup Level"



    )}



  </span>



</div>







{/* Timer display */}







<div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>


<div className="ph-timer-bar-container" style={{ flexGrow: 1, marginBottom: 0 }}>


<div


className={`ph-timer-bar-fill ${gameState.timerLeft <= 6 ? 'warning' : ''}`}


style={{ width: `${(gameState.timerLeft / 30) * 100}%` }}


/>


</div>


<span style={{ color: gameState.timerLeft <= 6 ? 'var(--ph-danger)' : 'var(--ph-text)', fontWeight: '800', whiteSpace: 'nowrap', flexShrink: 0, fontSize: '0.9rem' }}>


⏱️ {gameState.timerLeft}s


</span>


{gameState.isAnswered && (


<button className="ph-btn-primary" onClick={() => nextQuestion('company-quiz')} style={{ margin: 0 }}>


{gameState.currentQuestionIndex + 1 === getQuestionsList('company-quiz').length ? "Finish" : "Next"}


</button>


)}


</div>



{/* Question Display Card */}



<div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--ph-border)', margin: '1.5rem 0' }}>



<h3 style={{ margin: '0 0 1.5rem 0' }}>



Q{gameState.currentQuestionIndex + 1}: {getQuestionsList('company-quiz')[gameState.currentQuestionIndex].q}



</h3>



<div className="ph-options-grid" style={{ gridTemplateColumns: '1fr' }}>



{getQuestionsList('company-quiz')[gameState.currentQuestionIndex].a.map((opt, idx) => {



const isCorrect = idx === getQuestionsList('company-quiz')[gameState.currentQuestionIndex].c;



const isSelected = gameState.selectedOption === idx;



let btnClass = "";



if (gameState.isAnswered) {



if (isCorrect) btnClass = "correct";



else if (isSelected) btnClass = "incorrect";



}



return (



<button



key={idx}



className={`ph-option-btn ${btnClass}`}



onClick={() => selectOptionGame(idx, 'company-quiz')}



disabled={gameState.isAnswered}



>



<span>{opt}</span>



<span className="ph-option-marker">



{gameState.isAnswered && isCorrect ? "✓" : gameState.isAnswered && isSelected ? "✗" : String.fromCharCode(65 + idx)}



</span>



</button>



);



})}



</div>



</div>







</>



)}



</div>



)}



</div>



{/* Right Workspace Sidebar */}



<div className="ph-sidebar">



{/* Leaderboard Widget */}



<div className="ph-sidebar-section">



<h3>🏆 Global Leaderboard</h3>



<div className="ph-leaderboard-list">



{leaderboard.slice(0, 3).map((user, idx) => (



<div



key={idx}



className={`ph-leaderboard-item ${user.name === "You" ? 'user-highlight' : ''}`}



>



<div className="ph-lb-left">



<span className="ph-lb-rank">#{user.rank}</span>



<span className="ph-lb-name">{user.name}</span>



</div>



<span className="ph-lb-xp">{user.xp} XP</span>



</div>



))}



</div>



</div>







</div>



</div>



{/* Modal Backdrop Overlay */}



{(activeGame || mcqMode === 'battle') && (



<div className="ph-modal-backdrop" onClick={backToMenu} />



)}



{/* Badge Unlocked Notification Toast */}



{showBadgeToast && (



<div className="ph-badge-toast">



<span style={{ fontSize: '1.75rem' }}>🎁</span>



<div>



<div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--ph-accent)', fontWeight: '800', letterSpacing: '0.05em' }}>New Badge Earned!</div>



<div style={{ fontSize: '1.25rem', fontWeight: '800' }}>{showBadgeToast}</div>



</div>



</div>



)}



</div>



);



}



export default PracticeHub;

