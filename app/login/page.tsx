"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer;
    if (error) {
      timer = setTimeout(() => setError(""), 5000);
    }
    return () => clearTimeout(timer);
  }, [error]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      const res = await fetch("/api/ldapauth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message);
        setError("");
        setLoading(false);
      } else {
        setError(data.error);
        setSuccess("");
        setLoading(false);
      }
    } catch (err) {
      setError("Bilinmeyen hata oluştu. Yeniden deneyin");
      setSuccess("");
      setLoading(false);
    }
  };

  return (
  
    <div className="min-h-screen flex font-sans">
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ backgroundColor: "#0079CE" }}
      >
        <div className="relative z-10 flex flex-col justify-between w-full px-12 py-12">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-[#FCE7EA] rounded-lg flex items-center justify-center mr-3">
              <div
                className="w-4 h-4 rounded-sm bg-anket-primary-bg"
                //style={{ backgroundColor: "#0079CE" }}
              ></div>
            </div>
            <h1 className="text-xl font-semibold text-[#FCE7EA]">AnketApp</h1>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-4xl text-white mb-6 leading-tight">
              Veriye Dayalı Kararlar, Gerçek Sonuçlar.
            </h2>
            <p className="text-white/90 text-lg leading-relaxed">
              Akıllı anketlerle içgörüleri keşfet ve stratejini güçlendir.
            </p>
          </div>

          <div className="flex justify-between items-center text-white/70 text-sm">
            <span>©2025 - CSGB</span>
            <span className="cursor-pointer hover:text-white/90">
              Kullanım Koşulları
            </span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center mb-8">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: "#3F3FF3" }}
            >
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Frello</h1>
          </div>

          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl text-foreground">Merhaba</h2>
              <p className="text-muted-foreground">
                Kullanıcı adı ve şifrenizi girerek giriş yapın
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Kullanıcı Adı
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="h-12 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white focus:border-[#0079CE]"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Şifre
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white focus:border-[#0079CE]"
                  />
                </div>
              </div>
              <Button
                className="anket-primary-button"
                style={{ backgroundColor: "#0079CE" }}
                type="submit"
              >
                Giriş Yap
              </Button>
            </form>
          </div>
          <div className="h-20">
            {error && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 text-sm text-destructive-foreground bg-green-100 border border-green-700 rounded-lg">
                {success}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
