"use client";
import { useEffect, useState } from "react";
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
} from "@/components/ui/alert-dialog"; // Adjust the import path as necessary
import QRScanner from "@/components/QRScanner"; // Adjust the import path as necessary

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const handleScanSuccess = (data: string) => {
    const parts = data.split(' ');
    if (parts.length >= 2) {
      setRegistrationNumber(parts[0]);
      setName(parts.slice(1).join(' '));
    } else {
      console.log("Invalid QR Code content:", data);
    }
    setIsDialogOpen(true);
  };

  const handleScanError = (err: Error) => {
    console.error(err);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleConfirm = async () => {
    try {
      const { data, error: selectError } = await supabase
        .from('students')
        .select('registration_number')
        .eq('registration_number', registrationNumber);

      if (selectError) throw selectError;

      if (data.length > 0) {
        setMessage("Already marked present");
      } else {
        const [firstName, lastName] = name.split(' ');
        const { error: insertError } = await supabase
          .from('students')
          .insert([{ registration_number: registrationNumber, first_name: firstName, last_name: lastName }]);
        if (insertError) throw insertError;
        setMessage("QR Code confirmed and details updated!");
      }
    } catch (error) {
      console.error("Error updating details:", error);
      setMessage("Failed to update details.");
    }
    setIsDialogOpen(false);
    alert(message);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <QRScanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} />
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogTrigger asChild>
          <button style={{ display: "none" }}>Open</button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>QR Code Details</AlertDialogTitle>
            <AlertDialogDescription>
              <div>
                <p><strong>Registration Number:</strong> {registrationNumber}</p>
                <p><strong>Name:</strong> {name}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}