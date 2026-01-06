const SHEET_NAME = "遊戲紀錄";

// Web App 入口
function doGet(e){
  e = e || {};
  const params = e.parameter || {};
  const page = params.page;

  if(page === "game"){
    return HtmlService.createHtmlOutputFromFile('game').setTitle("狼人殺玩家頁");
  } else {
    return HtmlService.createHtmlOutputFromFile('index').setTitle("狼人殺主持人頁");
  }
}

// 取得試算表
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if(!sheet){
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["局號","玩家編號","角色","狀態","狼殺","女巫救人","女巫毒人","死亡"]);
  }
  return sheet;
}

// 建立遊戲
function createGame(playerCount){
  const gameId = getLastGameId() + 1;
  const roles = assignRoles(playerCount);
  const sheet = getSheet();
  roles.forEach((role, i)=>{
    sheet.appendRow([gameId, i+1, role, "存活","","","",""]);
  });
  return gameId;
}

// 分配角色
function assignRoles(playerCount){
  let roles = ["狼人","女巫"];
  for(let i=2;i<playerCount;i++) roles.push("平民");
  for(let i=roles.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [roles[i],roles[j]]=[roles[j],roles[i]];
  }
  return roles;
}

// 取得最新局號
function getLastGameId() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  if(data.length <= 1) return 0;
  return Math.max(...data.slice(1).map(r=>r[0]));
}

// 取得局資料
function getGame(gameId){
  gameId = Number(gameId);
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const players = [];
  for(let i=1;i<data.length;i++){
    if(Number(data[i][0])===gameId){
      players.push({id:Number(data[i][1]),role:data[i][2],alive:data[i][3]=="存活"});
    }
  }
  return {id:gameId, players};
}

// 玩家查看自己角色
function getPlayerInfo(gameId, playerId){
  gameId = Number(gameId);
  playerId = Number(playerId);
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for(let i=1;i<data.length;i++){
    if(Number(data[i][0])===gameId && Number(data[i][1])===playerId){
      const players=[];
      for(let j=1;j<data.length;j++){
        if(Number(data[j][0])===gameId){
          players.push({id:Number(data[j][1]),role:data[j][2],alive:data[j][3]=="存活"});
        }
      }
      return {id:gameId, player:{id:playerId,role:data[i][2],alive:data[i][3]=="存活"}, players};
    }
  }
  return null;
}

// ------------------ 夜晚操作 ------------------

// 狼人殺人
function wolfKill(gameId, targetId){
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for(let i=1;i<data.length;i++){
    if(Number(data[i][0])===gameId && Number(data[i][1])===targetId){
      sheet.getRange(i+1,5).setValue(targetId); // 狼殺
      sheet.getRange(i+1,4).setValue("死亡");
      break;
    }
  }
}

// 女巫救人
function witchSave(gameId, targetId){
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for(let i=1;i<data.length;i++){
    if(Number(data[i][0])===gameId && Number(data[i][1])===targetId){
      sheet.getRange(i+1,6).setValue(targetId); // 女巫救
      sheet.getRange(i+1,4).setValue("存活");
      break;
    }
  }
}

// 女巫下毒
function witchPoison(gameId, targetId){
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for(let i=1;i<data.length;i++){
    if(Number(data[i][0])===gameId && Number(data[i][1])===targetId){
      sheet.getRange(i+1,7).setValue(targetId); // 女巫毒
      sheet.getRange(i+1,4).setValue("死亡");
      break;
    }
  }
}
// 檢查勝利方
function checkWinner(gameId){
  gameId = Number(gameId);
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  let alivePlayers = [];
  for(let i=1;i<data.length;i++){
    if(Number(data[i][0])===gameId && data[i][3]==="存活"){
      alivePlayers.push(data[i][2]); // 角色名稱
    }
  }
  const wolves = alivePlayers.filter(r=>r==="狼人").length;
  const good = alivePlayers.length - wolves;

  if(wolves===0) return "好人勝利";
  if(wolves >= good) return "狼人勝利";
  return ""; // 遊戲未結束
}
