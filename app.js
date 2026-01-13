// ================= CONFIG =================
const ADMIN = "0xdaf343Fa66b7ecA5e76246B47fE60857A0572A8E".toLowerCase();
const POLYGON_SCAN = "https://polygonscan.com/tx/";
const STAKING_ADDRESS = "0xef1CC2A23c0023093C545044d9f7154863715a27";
const PRESALE_ADDRESS = "0x72cF8781aa3A6D7FD3324CD0dAA8b858461849d7";

// STAKING ABI
const STAKING_ABI = [/* ...your existing ABI... */];
// PRESALE ABI
const PRESALE_ABI = [/* ...your existing ABI... */];

// ================= STORAGE =================
let web3, account, staking, presale;
let users = JSON.parse(localStorage.getItem("users")) || [];
let supportDB = JSON.parse(localStorage.getItem("support")) || [];
let pointsDB = JSON.parse(localStorage.getItem("points")) || [];

// ================= NAVIGATION =================
document.querySelector(".hamburger")?.addEventListener("click",()=>{
 document.querySelector(".menu").classList.toggle("show");
});

// ================= WALLET CONNECT =================
async function connectWallet(){
 if(!window.ethereum) return alert("Install MetaMask");
 web3 = new Web3(window.ethereum);
 account = (await ethereum.request({ method:"eth_requestAccounts" }))[0];

 // Sign message for verification
 const signature = await web3.eth.personal.sign("Login to ZILA", account);
 console.log("Wallet connected & signed:", account, signature);

 document.querySelector(".wallet").innerText = account.slice(0,6)+"..."+account.slice(-4);
 staking = new web3.eth.Contract(STAKING_ABI, STAKING_ADDRESS);
 presale = new web3.eth.Contract(PRESALE_ABI, PRESALE_ADDRESS);
}

// ================= PRESALE =================
async function buyPresale(){
 if(!account) return alert("Connect wallet first");
 const pol = parseFloat(document.getElementById("buyPol").value);
 if(pol < 20) return alert("Minimum purchase: 20 POL");
 const val = web3.utils.toWei(pol.toString(),"ether");
 const tx = await presale.methods.buy().send({from:account, value:val});
 addHistory("presaleHistory", tx.transactionHash);
}

async function claimPresale(){
 if(!account) return alert("Connect wallet first");
 const tx = await presale.methods.claim().send({from:account});
 addHistory("presaleHistory", tx.transactionHash);
}

// ================= STAKING =================
async function stake(){
 if(!account) return alert("Connect wallet first");
 const amt = parseFloat(document.getElementById("stakeAmount").value);
 if(amt < 20000) return alert("Minimum stake: 20,000 ZILA");
 const plan = document.getElementById("stakePlan").value;
 const tx = await staking.methods.stake(web3.utils.toWei(amt.toString(),"ether"), plan).send({from:account});
 addHistory("stakingHistory", tx.transactionHash);
}

async function unstake(){
 if(!account) return alert("Connect wallet first");
 const tx = await staking.methods.unstake().send({from:account});
 addHistory("stakingHistory", tx.transactionHash);
}

async function claimStakeReward(){
 if(!account) return alert("Connect wallet first");
 const tx = await staking.methods.claim().send({from:account});
 addHistory("stakingHistory", tx.transactionHash);
}

// ================= HISTORY =================
function addHistory(id, hash){
 const div = document.getElementById(id);
 const a = document.createElement("a");
 a.href = POLYGON_SCAN + hash;
 a.target = "_blank";
 a.innerText = hash;
 a.className = "tx";
 div.prepend(a);
}

// ================= PROFILE =================
function saveProfile(){
 if(!account) return alert("Connect wallet first");
 const username = document.getElementById("profileUsername").value;
 const walletAddr = document.getElementById("profileWallet").value;
 const xLink = document.getElementById("profileX").value;
 const tgLink = document.getElementById("profileTelegram").value;
 const imgFile = document.getElementById("profileImage").files[0];

 if(imgFile && imgFile.size > 1024*1024) return alert("Image max 1MB");
 const reader = new FileReader();
 reader.onload = function(e){
   let user = users.find(u=>u.account===account) || {};
   user.account = account;
   user.username = username;
   user.wallet = walletAddr;
   user.x = xLink;
   user.telegram = tgLink;
   user.img = e.target.result;
   users = users.filter(u=>u.account!==account).concat(user);
   localStorage.setItem("users", JSON.stringify(users));
   alert("Profile saved");
 }
 if(imgFile) reader.readAsDataURL(imgFile);
 else saveProfileData();
}

function saveProfileData(){
 let user = users.find(u=>u.account===account) || {};
 user.account = account;
 user.username = document.getElementById("profileUsername").value;
 user.wallet = document.getElementById("profileWallet").value;
 user.x = document.getElementById("profileX").value;
 user.telegram = document.getElementById("profileTelegram").value;
 users = users.filter(u=>u.account!==account).concat(user);
 localStorage.setItem("users", JSON.stringify(users));
 alert("Profile saved");
}

// ================= REGISTER & LOGIN =================
function registerUser(){
 const username = document.getElementById("regUsername").value;
 const email = document.getElementById("regEmail").value;
 const password = document.getElementById("regPassword").value;
 const refCode = document.getElementById("regRef").value;

 if(users.find(u=>u.email===email)) return alert("Email already registered");
 const code = Math.random().toString(36).substring(2,6).toUpperCase();
 users.push({username,email,password,refCode:refCode || null,account:null,code,points:0});
 localStorage.setItem("users", JSON.stringify(users));
 alert("Registered! Verification code sent: " + code);
 window.location.href = "index.html";
}

function loginUser(){
 const email = document.getElementById("loginEmail").value;
 const password = document.getElementById("loginPassword").value;
 const user = users.find(u=>u.email===email && u.password===password);
 if(!user) return alert("Invalid credentials");
 account = user.account;
 alert("Login success");
 window.location.href = "index.html";
}

// ================= TASK & POINTS =================
function completeTask(taskId, point){
 let user = users.find(u=>u.account===account);
 if(!user) return alert("Login first");
 let taskKey = "task_"+taskId+"_"+account;
 if(localStorage.getItem(taskKey)) return alert("Task already completed");
 localStorage.setItem(taskKey, "done");
 user.points = (user.points||0) + point;
 localStorage.setItem("users", JSON.stringify(users));
 alert("Task completed! +" + point + " points");
}

// ================= LEADERBOARD =================
function renderLeaderboard(){
 const sorted = [...users].sort((a,b)=> (b.points||0) - (a.points||0)).slice(0,100);
 const div = document.getElementById("leaderboard");
 div.innerHTML = "";
 sorted.forEach((u,i)=>{
   const row = document.createElement("div");
   row.innerText = `${i+1}. ${u.username || u.account} - ${u.points||0} pts`;
   div.appendChild(row);
 });
}

// ================= ADMIN PANEL =================
function sendSupport(type){
 const msg = prompt("Enter your message:");
 if(!msg) return;
 supportDB.push({from:account,type,msg,reply:""});
 localStorage.setItem("support", JSON.stringify(supportDB));
 alert("Support request sent");
}

function adminReply(index){
 const reply = prompt("Reply:");
 supportDB[index].reply = reply;
 localStorage.setItem("support", JSON.stringify(supportDB));
 alert("Reply sent (only user sees it)");
}

// ================= UTILS =================
function logout(){
 account = null;
 window.location.reload();
}
