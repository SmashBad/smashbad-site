// pages/index.tsx
import React from "react";
import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BottomNav from "../components/BottomNav";
import DeviceTest from "../components/DeviceTest";

export default function Home() {
  return (
    <>
      
      <body className="home">

        {/* HERO SPLIT */}
        <main>
          <section className="hero-split">
            <div className="hero-split__text">
              <p className="kicker">Bienvenue sur SMASH</p>
              <h1>
                Ton partenaire
                <br />
                <span className="accent">Badminton</span>
              </h1>
              <p className="lead">
                Progresser, s’équiper, jouer : ce qu’il te faut pour vivre
                le badminton à fond.
              </p>
            </div>

            <div className="hero-split__art">
              <img
                src="/hero.png"
                alt="SMASH"
              />
            </div>
          </section>

        </main>


        <BottomNav />
        
      </body>
    </>
  );
}

