/** Public, passwordless questionnaire submission endpoint.
 * Keep Google script URL and its shared secret in Netlify *Functions* env vars.
 */
const ALLOWED = new Set([
 'participant_id','study_date','institution','interviewer','start_time','end_time','age','sex',
 'staff_category','staff_other','education','education_other','work_hours',
 ...['tea','soft','fruit','energy','biscuits','cakes','chocolate','yogurt','ice'].map(x=>'purchase_'+x),
 'buy_place','buy_place_other','buy_plan',
 ...['tea','soft','fruit','energy','biscuits','cakes','chocolate','doughnuts','yogurt','milk','ice'].map(x=>'consume_'+x),
 'cups_day','sugar_per_cup','times_work','aware','amount','meaning',
 ...['14','15','16a','16b','17','18','19','20','21','22','23','24','25'].map(x=>'d'+x),
 'smartphone','app_willing','app_features','app_frequency'
]);
const EXPECTED_PURCHASE=['never','days12','days34','days56','daily'];
const EXPECTED_CONSUME=['zero','days12','days34','days56','seven'];
const isCode=(x,values)=>typeof x==='string'&&values.includes(x);
const err=(message,status=400)=>Response.json({ok:false,message},{status,headers:{'Cache-Control':'no-store'}});
export default async function handler(request){
 if(request.method!=='POST')return err('Method not allowed',405);
 if((Number(request.headers.get('content-length'))||0)>24000)return err('Payload too large',413);
 const endpoint=Netlify.env.get('GOOGLE_APPS_SCRIPT_URL');
 const sharedSecret=Netlify.env.get('GOOGLE_SCRIPT_SECRET');
 if(!endpoint||!sharedSecret)return err('Data collection is not configured',503);
 try{
  const body=await request.json();
  if(typeof body!=='object'||!body||!['en','si','ta'].includes(body.language)||typeof body.submission_id!=='string'||!(/^[a-z0-9-]{16,75}$/i).test(body.submission_id)||typeof body.answers!=='object'||!body.answers||Array.isArray(body.answers))return err('Invalid submission');
  const answers={};
  for(const [key,value] of Object.entries(body.answers)){
   if(!ALLOWED.has(key))continue;
   if(Array.isArray(value)){
    if(value.length>12||value.some(v=>typeof v!=='string'||v.length>80))return err('Invalid answer');
    answers[key]=value;
   }else if(typeof value==='string'&&value.length<=200){answers[key]=value;}else return err('Invalid answer');
  }
  if(!Number.isInteger(Number(answers.age))||Number(answers.age)<15||Number(answers.age)>100||Number(answers.work_hours)<0||Number(answers.work_hours)>24)return err('Invalid age or work hours');
  for(const food of ['tea','soft','fruit','energy','biscuits','cakes','chocolate','yogurt','ice'])if(!isCode(answers['purchase_'+food],EXPECTED_PURCHASE))return err('Incomplete purchase responses');
  for(const food of ['tea','soft','fruit','energy','biscuits','cakes','chocolate','doughnuts','yogurt','milk','ice'])if(!isCode(answers['consume_'+food],EXPECTED_CONSUME))return err('Incomplete consumption responses');
  for(const k of ['14','15','16a','16b','17','18','19','20','21','22','23','24','25'])if(!isCode(answers['d'+k],['1','2','3','4','5']))return err('Incomplete COM-B responses');
  if(!isCode(answers.sex,['male','female','prefer'])||!isCode(answers.staff_category,['adminStaff','professional','technical','clerical','support','other'])||!isCode(answers.education,['ol','al','diploma','degree','postgrad','other'])||!isCode(answers.buy_plan,['yes','no','sometimes'])||!Array.isArray(answers.buy_place)||!answers.buy_place.length||answers.buy_place.some(v=>!['canteen','shop','home','delivery','other'].includes(v)))return err('Invalid demographic or purchase response');
  if(!isCode(answers.times_work,['none','once','twice','threeTimes','fourTimes'])||!isCode(answers.aware,['yes','no','notSure'])||!isCode(answers.meaning,['meaning1','meaning2','unaware'])||!isCode(answers.smartphone,['yes','no'])||!isCode(answers.app_willing,['yes','no','notSure'])||!isCode(answers.app_frequency,['each','onceDay','fewWeek','onceWeek','noRecord']))return err('Incomplete response');
  if(answers.aware==='yes'&&!isCode(answers.amount,['fiveSix','sevenEight','nineTen']))return err('Incomplete knowledge response');
  if(!Number.isInteger(Number(answers.cups_day))||Number(answers.cups_day)<0||Number(answers.cups_day)>30)return err('Invalid number of cups');
  if(Number(answers.cups_day)>0&&!isCode(answers.sugar_per_cup,['none','half','one','two','three','unaware']))return err('Incomplete tea/coffee response');
  if(answers.app_features!==undefined&&(!Array.isArray(answers.app_features)||answers.app_features.some(x=>!['record','intake','reminders','goal','alternatives','progress'].includes(x))))return err('Invalid app feature response');
  const upstream=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({secret:sharedSecret,submission_id:body.submission_id,language:body.language,answers}),signal:AbortSignal.timeout(15000),redirect:'follow'});
  if(!upstream.ok)return err('Google backend unavailable',502);
  const text=await upstream.text();let result;try{result=JSON.parse(text)}catch{return err('Google backend did not confirm',502)}
  if(result.ok!==true)return err('Google backend rejected submission',502);
  return Response.json({ok:true,submission_id:body.submission_id},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return err('Submission could not be confirmed',502)}
}
export const config={rateLimit:{action:'rate_limit',aggregateBy:'ip',windowSize:60,windowLimit:12}};
