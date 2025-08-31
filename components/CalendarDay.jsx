"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { startOfDay, endOfDay } from "@/lib/date";
import { subscribeCalendars } from "@/lib/calendars";

const HOURS = [...Array(24)].map((_,i)=>i);         // 0..23
const ROW = 60; // px per hour

export default function CalendarDay({date=new Date(), calendarFilter="all"}){
  const [user,setUser]=useState(null);
  const [events,setEvents]=useState([]);
  const [cals,setCals]=useState([]);

  useEffect(()=>onAuthStateChanged(auth,setUser),[]);

  useEffect(()=>{
    if(!user) return;
    const start = startOfDay(date);
    const end = endOfDay(date);
    const col = collection(db,"users",user.uid,"events");

    const constraints = [
      where("start",">=",start),
      where("start","<=",end),
      orderBy("start","asc"),
    ];
    if(calendarFilter!=="all"){
      constraints.unshift(where("calendarId","==",calendarFilter));
    }
    const q = query(col, ...constraints);
    const unsub = onSnapshot(q,(snap)=>{
      setEvents(snap.docs.map(d=>({id:d.id,...d.data()})));
    },(e)=>console.error("Day query failed", e));
    return ()=>unsub && unsub();
  },[user, date, calendarFilter]);

  useEffect(()=>{
    if(!user) return;
    return subscribeCalendars(user.uid, setCals);
  },[user]);

  const calMap = useMemo(()=>{
    const m={}; cals.forEach(c=>m[c.id]={name:c.name,color:c.color}); return m;
  },[cals]);

  return (
    <div
      className="bg-[var(--card-bg)] border border-[var(--outline-neutral)] rounded-[24px] p-6 w-full"
      style={{height:720, overflow:"hidden"}}
    >
      {/* top bar inside card */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 rounded-[8px] border grid place-items-center">◀</button>
          <div className="text-[22px] font-bold">
            {date.toLocaleDateString(undefined,{ day:"numeric", month:"long", year:"numeric"})}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button className="px-2 py-1 rounded border">Today</button>
          <button className="px-2 py-1 rounded border">Prev</button>
          <button className="px-2 py-1 rounded border">Next</button>
        </div>
      </div>

      {/* scrollable timeline */}
      <div className="relative" style={{height:640, overflow:"auto"}}>
        {/* time ruler */}
        <div className="absolute left-0 top-0 w-20 pr-2">
          {HOURS.map(h=>(
            <div key={h} className="h-[60px] text-right text-[14px] text-[var(--ink-muted)] pr-1">
              {new Date(0,0,0,h).toLocaleTimeString([],{hour:"numeric"})}
            </div>
          ))}
        </div>

        {/* canvas */}
        <div className="ml-20 relative" style={{height:HOURS.length*ROW}}>
          {/* hour grid lines */}
          {HOURS.map(h=>(
            <div key={h} className="absolute left-0 right-0 border-t border-gray-100" style={{top:h*ROW}} />
          ))}

          {/* events */}
          {events.map((e,idx)=>{
            const s = e.start?.toDate ? e.start.toDate() : new Date(e.start);
            const en = e.end?.toDate ? e.end.toDate() : new Date(e.end || s);
            const startMins = s.getHours()*60 + s.getMinutes();
            const endMins = en.getHours()*60 + en.getMinutes();
            const top = (startMins/60)*ROW;
            const height = Math.max(32, ((endMins - startMins)/60)*ROW || 40);

            const fill = calMap[e.calendarId]?.color || "#4F46E5";
            const outline = ({high:"var(--accent-red)", med:"var(--success-green)", low:"var(--brand)"}[e.priority] || "var(--outline-neutral)");
            const outlineWidth = ({high:6, med:5, low:4}[e.priority] || 1);

            return (
              <div
                key={e.id}
                className="absolute rounded-[24px] text-white font-semibold flex items-center justify-center text-sm shadow"
                style={{
                  top, left: 140, width: 180, height,
                  background: fill,
                  boxShadow: `0 0 0 ${outlineWidth}px ${outline} inset`
                }}
                title={e.title || e.summary}
                aria-label={`${e.title || e.summary} from ${s.toLocaleTimeString()} to ${en.toLocaleTimeString()}`}
              >
                <span className="px-2 text-center line-clamp-2">{e.title || e.summary}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
