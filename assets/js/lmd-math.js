(function(root){
"use strict";
function number(value){if(value===null||value===undefined||String(value).trim()==="")return null;const n=Number(value);return Number.isFinite(n)?n:null}
function average(items){
 if(!Array.isArray(items)||!items.length)return null;
 let numerator=0,denominator=0;
 for(const item of items){if(!item)return null;const value=number(item.value),weight=number(item.weight);if(value===null||weight===null||weight<=0)return null;numerator+=value*weight;denominator+=weight;if(!Number.isFinite(numerator)||!Number.isFinite(denominator))return null}
 const result=numerator/denominator;return Number.isFinite(result)?result:null;
}
function calculate(rows,passMark=10){
 const threshold=number(passMark);
 if(threshold===null||threshold<0||threshold>20)return {valid:false,reason:"pass-mark"};
 if(!Array.isArray(rows)||rows.length>500)return {valid:false,reason:"rows"};
 const modules=[];
 for(const row of rows){
  if(!row||typeof row!=="object"||Array.isArray(row))return {valid:false,reason:"row"};
  const name=String(row.name??"").trim(),ue=String(row.ue??"").trim(),semester=row.semester;
  const blank=(v)=>v===null||v===undefined||String(v).trim()==="";
  const ccBlank=blank(row.cc),examBlank=blank(row.exam),cc=ccBlank?null:number(row.cc),exam=examBlank?null:number(row.exam);
  const ccWeight=number(row.ccW),examWeight=number(row.examW),moduleCoefficient=number(row.mc),ueCoefficient=number(row.uc),credits=number(row.credits??0);
  if(!name&&!ue&&cc===null&&exam===null)continue;
  if(!name||!ue||!["S1","S2"].includes(semester)||(!ccBlank&&cc===null)||(!examBlank&&exam===null)||ccWeight===null||examWeight===null||moduleCoefficient===null||ueCoefficient===null||credits===null||ccWeight<0||examWeight<0||moduleCoefficient<=0||ueCoefficient<=0||credits<0||(cc!==null&&(cc<0||cc>20))||(exam!==null&&(exam<0||exam>20))||(cc===null&&exam===null)||((cc===null||ccWeight===0)&&(exam===null||examWeight===0)))return {valid:false,reason:"module"};
  const assessments=[];if(cc!==null&&ccWeight>0)assessments.push({value:cc,weight:ccWeight});if(exam!==null&&examWeight>0)assessments.push({value:exam,weight:examWeight});
  const moduleAverage=average(assessments);if(moduleAverage===null)return {valid:false,reason:"overflow"};
  modules.push({name,ue,semester,average:moduleAverage,moduleCoefficient,ueCoefficient,credits});
 }
 if(!modules.length)return {valid:false,reason:"empty"};
 const units=new Map();let coefficientConflict=false,creditConflict=false;
 for(const module of modules){
  const key=module.semester+"|"+module.ue;
  if(!units.has(key))units.set(key,{semester:module.semester,name:module.ue,coefficient:module.ueCoefficient,credits:module.credits,modules:[]});
  const unit=units.get(key);
  if(Math.abs(unit.coefficient-module.ueCoefficient)>1e-9)coefficientConflict=true;
  if(Math.abs(unit.credits-module.credits)>1e-9)creditConflict=true;
  unit.modules.push(module);
 }
 for(const unit of units.values()){
  unit.average=average(unit.modules.map(m=>({value:m.average,weight:m.moduleCoefficient})));
  if(unit.average===null)return {valid:false,reason:"overflow"};
  unit.earned=unit.average>=threshold?unit.credits:0;
 }
 const semesterAverages={S1:average([...units.values()].filter(u=>u.semester==="S1").map(u=>({value:u.average,weight:u.coefficient}))),S2:average([...units.values()].filter(u=>u.semester==="S2").map(u=>({value:u.average,weight:u.coefficient})))};
 const annual=average([...units.values()].map(u=>({value:u.average,weight:u.coefficient})));
 if(annual===null)return {valid:false,reason:"overflow"};
 const earnedECTS=[...units.values()].reduce((sum,u)=>sum+u.earned,0),totalECTS=[...units.values()].reduce((sum,u)=>sum+u.credits,0);
 if(!Number.isFinite(earnedECTS)||!Number.isFinite(totalECTS))return {valid:false,reason:"overflow"};
 return {valid:true,modules,units:[...units.values()],semesterAverages,annual,earnedECTS,totalECTS,coefficientConflict,creditConflict,passMark:threshold};
}
const api={average,calculate};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.CALCORA_LMD_MATH=api;
})(typeof window!=="undefined"?window:null);
