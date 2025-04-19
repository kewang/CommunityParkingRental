import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import ParkingSpaces from "@/pages/ParkingSpaces";
import PendingRequests from "@/pages/PendingRequests";
import Households from "@/pages/Households";
import CreateRental from "@/pages/CreateRental";
import OfferParking from "@/pages/OfferParking";
import Layout from "@/components/Layout";
import { useState } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={CreateRental} />
      <Route path="/create-rental" component={CreateRental} />
      <Route path="/pending-requests" component={PendingRequests} />
      <Route path="/offer-parking/:requestId" component={OfferParking} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  
  return (
    <QueryClientProvider client={queryClient}>
      <Layout lang={lang} setLang={setLang}>
        <Router />
      </Layout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
