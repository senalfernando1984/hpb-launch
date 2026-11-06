/** Sugar Smart Workplace Study — Google Apps Script backend.
 * Deploy as Web App: Execute as Me, Who has access: Anyone.
 * Open from Google Sheet: Extensions > Apps Script. Run setupHeaders() once.
 * setupHeaders() securely stores the spreadsheet ID and backend token as Script Properties.
 * The token is read from cell B2 of the owner's private Launch Setup sheet.
 * The public website NEVER exposes the shared secret. Review Google Sheet sharing separately.
 */
const FOODS_B=['tea','soft','fruit','energy','biscuits','cakes','chocolate','yogurt','ice'];
const FOODS_C=['tea','soft','fruit','energy','biscuits','cakes','chocolate','doughnuts','yogurt','milk','ice'];
const FACTOR_KEYS=['d14','d15','d16a','d16b','d17','d18','d19','d20','d21','d22','d23','d24','d25'];
const COLUMNS=['submitted_at','submission_id','language','participant_id','study_date','institution','interviewer','start_time','end_time','age','sex','staff_category','staff_other','education','education_other','work_hours',
 ...FOODS_B.map(x=>'purchase_'+x),'buy_place','buy_place_other','buy_plan',
 ...FOODS_C.map(x=>'consume_'+x),'cups_day','sugar_per_cup','times_work','aware','amount','meaning',
 ...FACTOR_KEYS,'smartphone','app_willing','app_features','app_frequency'];
function json_(x){return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON)}
function cell_(v){if(Array.isArray(v))v=v.join(' | ');if(v===undefined||v===null)return '';if(typeof v==='number')return v;let s=String(v).slice(0,240);if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return s;}
function getSheet_(){
 const id=PropertiesService.getScriptProperties().getProperty('SHEET_ID');if(!id)throw Error('SHEET_ID missing');
 const ss=SpreadsheetApp.openById(id);let sheet=ss.getSheetByName('Responses');
 if(!sheet)sheet=ss.insertSheet('Responses');
 if(sheet.getMaxColumns()<COLUMNS.length)sheet.insertColumnsAfter(sheet.getMaxColumns(),COLUMNS.length-sheet.getMaxColumns());
 if(sheet.getLastRow()===0){sheet.getRange(1,1,1,COLUMNS.length).setValues([COLUMNS]);sheet.setFrozenRows(1);sheet.getRange(1,1,1,COLUMNS.length).setBackground('#e4eeec').setFontWeight('bold');}
 return sheet;
}
function doPost(e){
 try{
  const input=JSON.parse(e.postData.contents||'{}');
  const token=PropertiesService.getScriptProperties().getProperty('GOOGLE_SCRIPT_SECRET');
  if(!token||input.secret!==token)return json_({ok:false,error:'Unauthorized'});
  if(typeof input.submission_id!=='string'||!input.answers||!['en','si','ta'].includes(input.language))return json_({ok:false,error:'Invalid request'});
  const lock=LockService.getScriptLock();if(!lock.tryLock(20000))return json_({ok:false,error:'Busy'});
  try{
   const sheet=getSheet_();const last=sheet.getLastRow();
   if(last>1){const found=sheet.getRange(2,2,last-1,1).createTextFinder(input.submission_id).matchEntireCell(true).findNext();if(found)return json_({ok:true,duplicate:true})}
   const answers=input.answers;
   const record=COLUMNS.map(key=>key==='submitted_at'?new Date().toISOString():key==='submission_id'?cell_(input.submission_id):key==='language'?input.language:cell_(answers[key]));
   sheet.getRange(sheet.getLastRow()+1,1,1,COLUMNS.length).setValues([record]);
   SpreadsheetApp.flush();return json_({ok:true});
  }finally{lock.releaseLock()}
 }catch(e){console.error('Submission error',String(e));return json_({ok:false,error:'Storage error'})}
}
function setupHeaders(){
 const ss=SpreadsheetApp.getActiveSpreadsheet();
 if(!ss)throw Error('Open this script from Google Sheets > Extensions > Apps Script.');
 const config=ss.getSheetByName('Launch Setup');
 if(!config)throw Error('Launch Setup tab is missing from the response spreadsheet.');
 const secret=String(config.getRange('B2').getDisplayValue()).trim();
 if(secret.length<32)throw Error('Backend token in Launch Setup!B2 is missing or too short.');
 PropertiesService.getScriptProperties().setProperties({SHEET_ID:ss.getId(),GOOGLE_SCRIPT_SECRET:secret});
 getSheet_();
 console.log('Sugar Smart backend setup complete. You can deploy the Web App.');
}