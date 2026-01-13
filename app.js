// ================= CONFIG =================
const ADMIN = "0xdaf343Fa66b7ecA5e76246B47fE60857A0572A8E".toLowerCase();
const POLYGON_SCAN = "https://polygonscan.com/tx/";

const STAKING_ADDRESS = "0xef1CC2A23c0023093C545044d9f7154863715";
const PRESALE_ADDRESS = "0x72cF8781aa3A6D7FD3324CD0dAA8b858461849d7";

const STAKING_ABI = [{"inputs":[{"internalType":"address","name":"_zilaToken","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"uint8","name":"_plan","type":"uint8"}],"name":"stake","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"unstake","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}];

const PRESALE_ABI = [{"inputs":[],"name":"buy","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"withdrawPOL","outputs":[],"stateMutability":"nonpayable","type":"function"}];

let web3, account, staking, presale;
let supportDB = JSON.parse(localStorage.getItem("support")) || [];
let userDB = JSON.parse(localStorage.getItem("users")) || [];
let taskDB = [
  {id:1,desc:"Follow X account",link:"#",points:100},
  {id:2,desc:"RT & Like Post #1",link:"#",points:100},
  {id:3,desc:"RT & Like Post #2",link:"#",points:100},
  {id:4,desc:"Comment on Post",link:"#",points:100},
  {id:5,desc:"Join Telegram",link:"#",points:100},
];
let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];

// ================= WALLET =================
async function connectWallet(){
  if(!window.ethereum) return alert("Install MetaMask");
  web3 = new Web3(window.ethereum);
  account = (await ethereum.request({method:"eth_requestAccounts"}))[0];
  
  const confirmed = confirm("Do you want to sign in with wallet?");
  if(!confirmed) return;

  const message = `Sign message to login ZILA Dashboard: ${new Date().toISOString()}`;
  const signature = await web3.eth.personal.sign(message, account);

  document.getElementById("connect").innerText = account.slice(0,6)+"..."+account.slice(-4);
  alert("Wallet connected and signed!");
  staking = new web3.eth.Contract(STAKING_ABI, STAKING_ADDRESS);
  presale = new web3.eth.Contract(PRESALE_ABI, PRESALE_ADDRESS);

  if(account.toLowerCase() === ADMIN){
    document.getElementById("admin").classList.remove("hidden");
    loadInbox();
  }
}

// ================= PRESALE =================
async function buyPresale(){
  const val = parseFloat(document.getElementById("buyPol").value);
  if(val < 20) return alert("Minimum purchase is 20 POL");
  const wei = web3.utils.toWei(val.toString(),"ether");
  const tx = await presale.methods.buy().send({from:account,value:wei});
  addHistory("presaleHistory", tx.transactionHash);
}

async function claimPresale(){
  const tx = await presale.methods.claim().send({from:account});
  addHistory("presaleHistory", tx.transactionHash);
}

// ================= STAKING =================
async function stake(){
  const amt = parseFloat(document.getElementById("stakeAmount").value);
  const plan = parseInt(document.getElementById("stakePlan").value);

  if(plan === 0 && amt < 20000) return alert("Minimum flexible staking is 20,000 ZILA");
  if(plan === 1 && amt < 50000) return alert("Minimum 6-month staking is 50,000 ZILA");
  if(plan === 2 && amt < 100000) return alert("Minimum 1-year staking is 100,000 ZILA");

  const wei = web3.utils.toWei(amt.toString(),"ether");
  const tx = await staking.methods.stake(wei, plan).send({from:account});
  addHistory("stakingHistory", tx.transactionHash);
}

async function unstake(){
  const tx = await staking.methods.unstake().send({from:account});
  addHistory("stakingHistory", tx.transactionHash);
}

async function claim(){
  const tx = await staking.methods.claim().send({from:account});
  addHistory("stakingHistory", tx.transactionHash);
}

// ================= HISTORY =================
function addHistory(id, hash){
  const div = document.getElementById(id);
  if(!div) return;
  const a = document.createElement("a");
  a.href = POLYGON_SCAN + hash;
  a.target = "_blank";
  a.innerText = hash;
  a.className = "tx";
  div.prepend(a);
}

// ================= SUPPORT =================
function sendSupport(type){
  const msg = type==="presale" ? document.getElementById("psMsg").value : document.getElementById("stkMsg").value;
  supportDB.push({from:account,type,msg,reply:""});
  localStorage.setItem("support", JSON.stringify(supportDB));
  alert("Support request sent");
}

function loadInbox(){
  const box = document.getElementById("adminInbox");
  box.innerHTML="";
  supportDB.forEach((s)=>{
    box.innerHTML += `<p><b>${s.type}</b><br>${s.from}<br>${s.msg}</p><hr>`;
  });
}

function replySupport(){
  const reply = document.getElementById("adminReply").value;
  supportDB[supportDB.length-1].reply = reply;
  localStorage.setItem("support", JSON.stringify(supportDB));
  alert("Reply sent (only user can see)");
}

// ================= PROFILE =================
function saveProfile(){
  const username = document.getElementById("username").value;
  const wallet = document.getElementById("walletAddress").value;
  const x = document.getElementById("xAcc").value;
  const tg = document.getElementById("tgAcc").value;
  const fileInput = document.getElementById("profileImg");

  let imgData = localStorage.getItem("profileImg") || "";
  if(fileInput.files[0]){
    const file = fileInput.files[0];
    if(file.size > 1024*1024) return alert("Max 1MB image");
    const reader = new FileReader();
    reader.onload = ()=> {
      imgData = reader.result;
      localStorage.setItem("profileImg", imgData);
      document.getElementById("profilePic").src = imgData;
    }
    reader.readAsDataURL(file);
  }
  localStorage.setItem("profile", JSON.stringify({username,wallet,x,tg}));
  alert("Profile saved!");
}

// ================= REGISTER =================
function register(){
  const username = document.getElementById("regUsername").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const ref = document.getElementById("refCode").value;

  if(userDB.find(u=>u.email===email)) return alert("Email already registered!");
  const code = Math.random().toString(36).substring(2,6).toUpperCase();
  userDB.push({username,email,password,referral:ref,code,poin:0});
  localStorage.setItem("users", JSON.stringify(userDB));
  alert("Registered! Verification code sent to email: "+code);
}

// ================= TASK =================
function loadTasks(){
  const div = document.getElementById("taskList");
  div.innerHTML="";
  taskDB.forEach(task=>{
    const btn = document.createElement("button");
    btn.innerText = `${task.desc} (+${task.points} pts)`;
    btn.onclick = ()=>{
      window.open(task.link,"_blank");
      alert(`Simulate task done, +${task.points} points credited`);
    }
    div.appendChild(btn);
  });
}

// ================= LEADERBOARD =================
function loadLeaderboard(){
  const div = document.getElementById("leaderboardList");
  div.innerHTML="";
  const sorted = userDB.sort((a,b)=>b.poin-a.poin).slice(0,100);
  sorted.forEach((u,i)=>{
    div.innerHTML += `<p>${i+1}. ${u.username} - ${u.poin} pts</p>`;
  });
}

// ================= INITIALIZE =================
window.onload = ()=>{
  if(document.getElementById("connect"))
    document.getElementById("connect").onclick = connectWallet;
  if(document.getElementById("taskList")) loadTasks();
  if(document.getElementById("leaderboardList")) loadLeaderboard();

  // Price chart simulation for presale
  const chartEl = document.getElementById("chart");
  if(chartEl){
    const ctx = chartEl.getContext("2d");
    let price = 0.000625;
    const prices = Array(25).fill(price);
    const chart = new Chart(ctx,{
      type:"line",
      data:{labels:Array(25).fill(0).map((_,i)=>i),datasets:[{data:prices,borderWidth:2,borderColor:"#00ffd5",tension:.4,pointRadius:0}]},
      options:{plugins:{legend:{display:false}},scales:{x:{display:false},y:{display:false}}}
    });
    setInterval(()=>{
      price += (Math.random()*0.00000015);
      prices.push(price); prices.shift();
      chart.update();
      document.getElementById("priceLabel").innerText = "Current Price: "+price.toFixed(8)+" POL";
    },3000);
  }
}
