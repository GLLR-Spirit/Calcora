"use strict";
function finite(value){if(value===null||value===undefined||String(value).trim()==="")return null;const n=Number(value);return Number.isFinite(n)?n:null}
function calculateGrade(input){
  if(!input||typeof input!=="object")return {valid:false,reason:"settings"};
  const min=finite(input.min),max=finite(input.max),type=input.type;
  if(min===null||max===null||max<=min||!["weighted","simple","year","target"].includes(type))return {valid:false,reason:"settings"};
  if(type==="year"){
    const a=finite(input.semester1),b=finite(input.semester2),wa=finite(input.weight1),wb=finite(input.weight2);
    if(a===null||b===null||wa===null||wb===null||a<min||a>max||b<min||b>max||wa<=0||wb<=0)return {valid:false,reason:"input"};
    const denominator=wa+wb,numerator=a*wa+b*wb,value=numerator/denominator;
    if(!Number.isFinite(denominator)||!Number.isFinite(numerator)||!Number.isFinite(value)||denominator<=0)return {valid:false,reason:"input"};
    return {valid:true,value,label:"annual"};
  }
  if(type==="target"){
    const target=finite(input.target),current=finite(input.currentTotal),done=finite(input.completedCoefficient),remaining=finite(input.remainingCoefficient);
    if(target===null||current===null||done===null||remaining===null||target<min||target>max||current<0||done<0||remaining<=0)return {valid:false,reason:"input"};
    const totalCoefficient=done+remaining,numerator=target*totalCoefficient-current,value=numerator/remaining;
    if(!Number.isFinite(totalCoefficient)||!Number.isFinite(numerator)||!Number.isFinite(value))return {valid:false,reason:"input"};
    return value<min||value>max?{valid:true,impossible:true,value,label:"need"}:{valid:true,value,label:"need"};
  }
  if(!Array.isArray(input.rows)||!input.rows.length)return {valid:false,reason:"rows"};
  let total=0,denominator=0;
  for(const row of input.rows){
    if(!row)return {valid:false,reason:"rows"};
    const mark=finite(row.mark),coefficient=finite(row.coefficient);
    if(mark===null||coefficient===null||mark<min||mark>max||coefficient<=0)return {valid:false,reason:"rows"};
    total+=type==="simple"?mark:mark*coefficient;
    denominator+=type==="simple"?1:coefficient;
    if(!Number.isFinite(total)||!Number.isFinite(denominator))return {valid:false,reason:"rows"};
  }
  const value=total/denominator;
  if(!Number.isFinite(value)||denominator<=0)return {valid:false,reason:"rows"};
  return {valid:true,value,label:type==="simple"?"simple":"average"};
}
const api={calculateGrade};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(typeof window!=="undefined")window.CALCORA_ALGERIA_GRADE_MATH=api;
