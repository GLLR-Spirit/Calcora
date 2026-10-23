const test = require("node:test");
const assert = require("node:assert/strict");
const { getDashboardStats, getWeeklyReport, validDate } = require("../assets/js/progress-dashboard.js");

test("dashboard aggregates today and current-week study logs", () => {
 const now = new Date("2026-10-23T12:00:00");
 const data = {goal:60,items:{log:[{date:"2026-10-23",minutes:25},{date:"2026-10-22",minutes:30},{date:"2026-10-10",minutes:90}]}};
 const s = getDashboardStats(data,[],now);
 assert.equal(s.todayMinutes,25); assert.equal(s.weekMinutes,55); assert.equal(s.weekSessions,2); assert.equal(s.goal,60);
});
test("weekly totals include today's sessions even before noon", () => {
 const now=new Date("2026-10-23T08:00:00");
 const s=getDashboardStats({items:{log:[{date:"2026-10-23",minutes:25},{date:"2026-10-22",minutes:30},{date:"2026-10-10",minutes:90}]}},[],now);
 assert.equal(s.todayMinutes,25); assert.equal(s.weekMinutes,55); assert.equal(s.weekSessions,2);
});
test("dashboard counts tasks, mastery and weak topics safely", () => {
 const s=getDashboardStats({items:{tasks:[{done:true},{done:false,text:"Revise C"}],topics:[{name:"Pointers",level:1},{name:"Loops",level:5},{name:"bad",level:"x"}],weak:[{text:"Pointers"}]}},[],new Date("2026-10-23T12:00:00"));
 assert.equal(s.tasksDone,1); assert.equal(s.tasksTotal,2); assert.equal(s.topicsMastered,1); assert.equal(s.topicsTotal,2); assert.equal(s.weakTopics[0].name,"Pointers"); assert.equal(s.weak.length,1);
});
test("dashboard lists future exams only and sorts by nearest date", () => {
 const s=getDashboardStats({items:{deadline:[{name:"Later",date:"2026-11-10"},{name:"Soon",date:"2026-10-25"},{name:"Past",date:"2026-10-01"}]}},[],new Date("2026-10-23T12:00:00"));
 assert.deepEqual(s.exams.map(x=>x.name),["Soon","Later"]);
});
test("dashboard handles due cards, future cards and malformed records", () => {
 const s=getDashboardStats({},[{q:"Q1",a:"A1"},{q:"Q2",a:"A2",dueAt:1000},{q:"Q3",a:"A3",dueAt:9999999999999},null],new Date("2026-10-23T12:00:00"));
 assert.equal(s.totalCards,3); assert.equal(s.dueCards,2); assert.ok(s.nextDue>new Date("2026-10-23T12:00:00").getTime());
});
test("date validation rejects invalid formats and impossible calendar dates",()=>{assert.equal(validDate("2026-10-23"),true);assert.equal(validDate("23/10/2026"),false);assert.equal(validDate("invalid"),false);assert.equal(validDate("2026-02-31"),false);assert.equal(validDate("2026-13-01"),false);assert.equal(validDate("2026-04-00"),false);assert.equal(validDate("0001-01-01"),true)});

test("weekly report compares current and previous weeks without counting future days", () => {
 const now=new Date("2026-10-23T12:00:00");
 const data={goal:30,items:{log:[{date:"2026-10-19",minutes:30},{date:"2026-10-20",minutes:15},{date:"2026-10-12",minutes:45},{date:"2026-10-25",minutes:999}],tasks:[{done:false,text:"Revise"}],topics:[{name:"Pointers",level:2}]}};
 const r=getWeeklyReport(data,now);
 assert.equal(r.thisMinutes,45);assert.equal(r.previousMinutes,45);assert.equal(r.activeDays,2);assert.equal(r.goalDays,1);assert.equal(r.elapsedDays,5);
 assert.ok(r.suggestions.some(s=>s.includes("Pointers")));
});
test("weekly report handles empty data and unset goals", () => {
 const r=getWeeklyReport({},new Date("2026-10-23T12:00:00"));
 assert.equal(r.thisMinutes,0);assert.equal(r.previousMinutes,0);assert.equal(r.goalDays,0);assert.equal(r.activeDays,0);assert.ok(r.suggestions.length>0);
});
