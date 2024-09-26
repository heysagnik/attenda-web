"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import QRScanner from "@/components/QRScanner";
import { User } from "@supabase/supabase-js";
import Logo from "@/app/logo.png";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const qrScannerRef = useRef<{ restart: () => void } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        setIsLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const handleScanSuccess = (data: string) => {
    const parts = data.split(" ");
    if (parts.length >= 2) {
      setRegistrationNumber(parts[0]);
      setName(parts.slice(1).join(" "));
      setIsDialogOpen(true);
    } else {
      console.log("Invalid QR Code content:", data);
      setMessage("Invalid QR Code. Please try again.");
      setIsMessageDialogOpen(true);
    }
  };

  const handleScanError = (err: Error) => {
    console.error(err);
    setMessage("Error scanning QR Code. Please try again.");
    setIsMessageDialogOpen(true);
  };

  const handleConfirm = async () => {
    try {
      const { data, error: selectError } = await supabase
        .from("students")
        .select("registration_number")
        .eq("registration_number", registrationNumber)
        .single();

      if (selectError && selectError.code !== "PGRST116") throw selectError;

      if (data) {
        setMessage("Already marked present");
      } else {
        const nameParts = name.split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
        const { error: insertError } = await supabase
          .from("students")
          .insert([{ registration_number: registrationNumber, first_name: firstName, last_name: lastName }]);
        if (insertError) throw insertError;
        setMessage("Attendance marked successfully!");
      }
    } catch (error) {
      console.error("Error updating details:", error);
      setMessage("Failed to update details.");
    }
    setIsDialogOpen(false);
    setIsMessageDialogOpen(true);
  };

  const handleMessageDialogClose = () => {
    setIsMessageDialogOpen(false);
    if (qrScannerRef.current) {
      qrScannerRef.current.restart();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <nav className="bg-blue-600 p-4 text-white">
        <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center">
            <img src={Logo.src} alt="Logo" className="h-8 w-8 mr-2" />
            <h1 className="text-2xl font-bold">Attenda</h1>
            </div>
         
          <div className="flex items-center">
            <span className="mr-2">{user?.email}</span>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              className="bg-white text-blue-600 px-4 py-2 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-md p-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4 text-center">
                Scan QR Code
              </h2>
              <div className="aspect-square relative">
                <QRScanner
                  ref={qrScannerRef}
                  onScanSuccess={handleScanSuccess}
                  onScanError={handleScanError}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="p-4 text-gray-400 text-center">
        <p>Made with ❤️ by Sagnik</p>
      </footer>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Attendance</AlertDialogTitle>
            <AlertDialogDescription>
              <p>
                <strong>Registration Number:</strong> {registrationNumber}
              </p>
              <p>
                <strong>Name:</strong> {name}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isMessageDialogOpen}
        onOpenChange={setIsMessageDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notification</AlertDialogTitle>
            <AlertDialogDescription>
              <p>{message}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleMessageDialogClose}>Ok</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
