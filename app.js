// ================= WALLET =================
async function connectWallet(){
  if(!window.ethereum) return alert("Install MetaMask");
  web3 = new Web3(window.ethereum);
  account = (await ethereum.request({method:"eth_requestAccounts"}))[0];

  // Signature verification
  const confirmed = confirm("Do you want to sign in with wallet?");
  if(!confirmed) return;
  const message = `Sign message to login ZILA Dashboard: ${new Date().toISOString()}`;
  const signature = await web3.eth.personal.sign(message, account);

  // Update UI
  document.getElementById("connect").innerText = account.slice(0,6)+"..."+account.slice(-4);
  alert("Wallet connected and signed!");

  // Inisialisasi contract
  staking = new web3.eth.Contract(STAKING_ABI, STAKING_ADDRESS);
  presale = new web3.eth.Contract(PRESALE_ABI, PRESALE_ADDRESS);

  if(account.toLowerCase() === ADMIN){
    document.getElementById("admin").classList.remove("hidden");
    loadInbox();
  }
}

// ================= HELP FUNCTION =================
async function ensureWallet(){
  if(!account){
    await connectWallet();
    if(!account) throw new Error("Wallet not connected");
  }
}

// ================= PRESALE =================
async function buyPresale(){
  try{
    await ensureWallet();
    const val = parseFloat(document.getElementById("buyPol").value);
    if(val < 20) return alert("Minimum purchase is 20 POL");
    const wei = web3.utils.toWei(val.toString(),"ether");
    const tx = await presale.methods.buy().send({from:account,value:wei});
    addHistory("presaleHistory", tx.transactionHash);
    alert("Buy successful!");
  }catch(err){console.error(err); alert("Transaction failed");}
}

async function claimPresale(){
  try{
    await ensureWallet();
    const tx = await presale.methods.claim().send({from:account});
    addHistory("presaleHistory", tx.transactionHash);
    alert("Claim successful!");
  }catch(err){console.error(err); alert("Claim failed");}
}

// ================= STAKING =================
async function stake(){
  try{
    await ensureWallet();
    const amt = parseFloat(document.getElementById("stakeAmount").value);
    const plan = parseInt(document.getElementById("stakePlan").value);

    if(plan === 0 && amt < 20000) return alert("Minimum flexible staking is 20,000 ZILA");
    if(plan === 1 && amt < 50000) return alert("Minimum 6-month staking is 50,000 ZILA");
    if(plan === 2 && amt < 100000) return alert("Minimum 1-year staking is 100,000 ZILA");

    const wei = web3.utils.toWei(amt.toString(),"ether");
    const tx = await staking.methods.stake(wei, plan).send({from:account});
    addHistory("stakingHistory", tx.transactionHash);
    alert("Stake successful!");
  }catch(err){console.error(err); alert("Stake failed");}
}

async function unstake(){
  try{
    await ensureWallet();
    const tx = await staking.methods.unstake().send({from:account});
    addHistory("stakingHistory", tx.transactionHash);
    alert("Unstake successful!");
  }catch(err){console.error(err); alert("Unstake failed");}
}

async function claim(){
  try{
    await ensureWallet();
    const tx = await staking.methods.claim().send({from:account});
    addHistory("stakingHistory", tx.transactionHash);
    alert("Claim reward successful!");
  }catch(err){console.error(err); alert("Claim failed");}
}
