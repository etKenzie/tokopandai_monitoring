"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";

const StoresPage = () => {
  useEffect(() => {
    redirect('/distribusi/stores/overview');
  }, []);

  return null;
};

export default StoresPage;
