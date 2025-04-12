import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import ParkingSpaces from "@/pages/ParkingSpaces";
import Rentals from "@/pages/Rentals";
import Households from "@/pages/Households";
import Layout from "@/components/Layout";
import { useState } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/parking-spaces" component={ParkingSpaces} />
      <Route path="/rentals" component={Rentals} />
      <Route path="/households" component={Households} />
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
