import { IonContent, IonIcon, IonPage } from "@ionic/react";
import React, { useState, useEffect } from "react";
import { lockClosedOutline, walletOutline } from "ionicons/icons";
import Welcome from "../components/Welcome";
import PrimaryWallet from "../components/PrimaryWallet";
import SavingsWallet from "../components/SavingsWallet";
import Buttons from "../components/Buttons";
import SpendingAnalysisChart from "../components/SpendingAnalysisChart";
import RecentTransactions, {
  Transaction,
} from "../components/RecentTransactions";

const PRIMARY_CHART_DATA = [
  { name: "Mon", saved: 400, spent: 240 },
  { name: "Tue", saved: 300, spent: 139 },
  { name: "Wed", saved: 200, spent: 680 },
  { name: "Thu", saved: 278, spent: 390 },
  { name: "Fri", saved: 189, spent: 480 },
  { name: "Sat", saved: 239, spent: 380 },
  { name: "Sun", saved: 349, spent: 430 },
];

const SAVINGS_CHART_DATA = [
  { name: "Mon", saved: 1400, spent: 0 },
  { name: "Tue", saved: 1500, spent: 0 },
  { name: "Wed", saved: 1550, spent: 0 },
  { name: "Thu", saved: 1600, spent: 0 },
  { name: "Fri", saved: 1800, spent: 0 },
  { name: "Sat", saved: 2000, spent: 0 },
  { name: "Sun", saved: 2200, spent: 0 },
];

const PRIMARY_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    title: "Canteen Snacks",
    amount: 85,
    type: "expense",
    category: "Food",
    date: "Today",
  },
  {
    id: "2",
    title: "Freelance Gig",
    amount: 1200,
    type: "income",
    category: "Work",
    date: "Yesterday",
  },
  {
    id: "3",
    title: "Metro Recharge",
    amount: 200,
    type: "expense",
    category: "Transport",
    date: "Yesterday",
  },
];

const SAVINGS_TRANSACTIONS: Transaction[] = [
  {
    id: "s1",
    title: "Goal Deposit",
    amount: 500,
    type: "income",
    category: "Savings",
    date: "Today",
  },
  {
    id: "s2",
    title: "Monthly Interest",
    amount: 150,
    type: "income",
    category: "Interest",
    date: "01 Nov",
  },
  {
    id: "s3",
    title: "Emergency Fund",
    amount: 1000,
    type: "income",
    category: "Deposit",
    date: "28 Oct",
  },
];

const Home: React.FC = () => {
  const [activeWallet, setActiveWallet] = useState<"Primary" | "Savings">(
    "Primary",
  );
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        setGreeting("Good Morning");
      } else if (hour >= 12 && hour < 17) {
        setGreeting("Good Afternoon");
      } else if (hour >= 17 && hour < 21) {
        setGreeting("Good Evening");
      } else {
        setGreeting("Good Night");
      }
    };
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  const currentData = {
    chartData:
      activeWallet === "Primary" ? PRIMARY_CHART_DATA : SAVINGS_CHART_DATA,
    chartColor: activeWallet === "Primary" ? "#a468ff" : "#10b981",
    transactions:
      activeWallet === "Primary" ? PRIMARY_TRANSACTIONS : SAVINGS_TRANSACTIONS,
  };

  return (
    <IonPage>
      <IonContent className="">
        <div className="relative z-10">
          <Welcome greeting={greeting} />
        </div>
        <div
          className="ion-margin relative z-10 flex flex-row rounded-4xl bg-gray-800 px-2 py-2 text-center text-white"
          style={{ marginTop: "16px" }}
        >
          <div
            className={`absolute top-2 bottom-2 w-[calc(50%-10px)] rounded-4xl bg-(--ion-color-primary) transition-all duration-300 ${
              activeWallet === "Primary" ? "left-2" : "left-[calc(50%+2px)]"
            }`}
          />
          <div
            onClick={() => setActiveWallet("Primary")}
            className="z-10 flex flex-1 items-center justify-center gap-2 px-6 py-2"
          >
            Primary
            <IonIcon icon={walletOutline} />
          </div>
          <div
            onClick={() => setActiveWallet("Savings")}
            className="z-10 flex flex-1 items-center justify-center gap-2 px-6 py-2"
          >
            Savings
            <IonIcon icon={lockClosedOutline} />
          </div>
        </div>
        <div className="relative">
          <div
            className={`transition-all duration-300 ease-out ${
              activeWallet === "Primary"
                ? "opacity-100"
                : "pointer-events-none absolute inset-0 opacity-0"
            }`}
          >
            <PrimaryWallet />
          </div>
          <div
            className={`transition-all duration-300 ease-out ${
              activeWallet === "Savings"
                ? "opacity-100"
                : "pointer-events-none absolute inset-0 opacity-0"
            }`}
          >
            <SavingsWallet />
          </div>
          <Buttons />

          <SpendingAnalysisChart
            data={currentData.chartData}
            chartColor={currentData.chartColor}
          />

          <RecentTransactions transactions={currentData.transactions} />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
