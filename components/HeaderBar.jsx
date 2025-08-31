"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function HeaderBar(){
  const [name,setName]=useState("Guest");
  const [photo,setPhoto]=useState("");

  useEffect(()=>onAuthStateChanged(auth,u=>{
    if(!u){setName("Guest");setPhoto("");return;}
    setName(u.displayName || "User");
    setPhoto(u.photoURL || "");
  }),[]);

  return (
    <header className="w-full pt-6" aria-label="Global header">
      <div className="max-w-[1600px] mx-auto px-6 relative">
        <h1 className="text-[44px] font-bold text-center text-gray-900">
          Welcome to LifeHub
        </h1>
        <div className="absolute right-6 top-0 mt-6 flex items-center gap-2">
          <span className="text-[16px] font-semibold text-gray-800">Hello {name}</span>
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
            {photo ? <img src={photo} alt="" className="w-full h-full object-cover"/> : null}
          </div>
        </div>
      </div>
    </header>
  );
}
