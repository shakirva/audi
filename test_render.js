import React from 'react';
import ReactDOMServer from 'react-dom/server';

function CalendarStub() {
  const year = 2026;
  const month = 8;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i+1)];
  
  return React.createElement('div', { className: 'grid' }, 
    cells.map((day, i) => {
      if (!day) return React.createElement('div', { key: i, id: `empty-${i}` });
      return React.createElement('div', { key: day, id: `day-${day}` }, day);
    })
  );
}

console.log(ReactDOMServer.renderToString(React.createElement(CalendarStub)));
