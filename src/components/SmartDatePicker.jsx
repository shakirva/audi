import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Circle } from "lucide-react";
import { availabilityAPI } from "../services/api";

export default function SmartDatePicker({ 
  value, 
  onChange, 
  hallPreference, 
  onFocus, 
  onBlur, 
  style 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date());
  const [monthAvail, setMonthAvail] = useState({});
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  // Parse current viewing month & year
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-12

  // Fetch month availability whenever month or hall changes
  useEffect(() => {
    if (!isOpen || !hallPreference) return;
    
    let isMounted = true;
    setLoading(true);
    
    availabilityAPI.getMonth(hallPreference, year, month)
      .then(res => {
        if (isMounted) setMonthAvail(res.data.data || {});
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setLoading(false);
      });
      
    return () => { isMounted = false; };
  }, [isOpen, hallPreference, year, month]);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        if (onBlur) onBlur();
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onBlur]);

  // Calendar logic
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0 = Sunday
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null); // empty padding days
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handlePrevMonth = (e) => {
    e.preventDefault();
    setCurrentDate(new Date(year, month - 2, 1));
  };
  
  const handleNextMonth = (e) => {
    e.preventDefault();
    setCurrentDate(new Date(year, month, 1));
  };

  const handleSelectDate = (day) => {
    if (!day) return;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Prevent selecting if fully booked? 
    // The prompt says "Full Day Booked -> User cannot save enquiry for this hall on that date"
    // Let's allow selection but UI will show the warning below the picker anyway.
    
    onChange({ target: { name: "tentativeDate", value: dateStr } });
    setIsOpen(false);
    if (onBlur) onBlur();
  };

  const formatDateLabel = (val) => {
    if (!val) return "dd/mm/yyyy";
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* Input Facade */}
      <div 
        onClick={() => {
          if (!hallPreference) {
            alert("Please select a Hall first to view its availability calendar.");
            return;
          }
          setIsOpen(!isOpen);
          if (onFocus) onFocus();
        }}
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          background: "#fff",
        }}
      >
        <span style={{ color: value ? "#111" : "#9ca3af" }}>{formatDateLabel(value)}</span>
        <CalendarIcon size={14} color="#6b7280" />
      </div>

      {/* Dropdown Calendar */}
      {isOpen && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          zIndex: 9999,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          width: 290,
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          fontFamily: "'DM Sans', sans-serif"
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <button type="button" onClick={handlePrevMonth} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <ChevronLeft size={16} color="#374151" />
            </button>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#111" }}>
              {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(currentDate)}
            </div>
            <button type="button" onClick={handleNextMonth} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <ChevronRight size={16} color="#374151" />
            </button>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 16, fontSize: 10, fontWeight: 700, color: "#6b7280" }}>
             <div style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: "#16a34a" }}></span> Available</div>
             <div style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: "#d97706" }}></span> Partial</div>
             <div style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: "#ef4444" }}></span> Booked</div>
          </div>

          {/* Days Header */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {days.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = value === dateStr;
              
              let statusObj = monthAvail[dateStr];
              let dotColor = "#16a34a"; // available
              if (statusObj) {
                if (statusObj.status === "Fully Booked") dotColor = "#ef4444";
                else if (statusObj.status === "Partially Booked") dotColor = "#d97706";
              }
              
              const isToday = new Date().toISOString().split("T")[0] === dateStr;

              return (
                <div 
                  key={day}
                  onClick={() => handleSelectDate(day)}
                  style={{
                    height: 36,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: isSelected ? "#1B4332" : (isToday ? "#f0faf4" : "transparent"),
                    color: isSelected ? "#fff" : "#111",
                    fontWeight: isSelected || isToday ? 800 : 500,
                    fontSize: 13,
                    border: isToday && !isSelected ? "1px solid #1B4332" : "1px solid transparent",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = "#f3f4f6";
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = isToday ? "#f0faf4" : "transparent";
                  }}
                >
                  <span style={{ marginBottom: 2 }}>{day}</span>
                  {/* Indicator Dot */}
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: dotColor, opacity: isSelected ? 1 : 0.8 }} />
                </div>
              );
            })}
          </div>
          
          {loading && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1B4332" }}>Loading...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
