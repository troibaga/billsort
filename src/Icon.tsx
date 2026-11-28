const symbols = {
  phone: <><rect x="6" y="2" width="12" height="20" rx="2.7"/><path d="M10 5h4m-3 14h2"/></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></>,
  layers: <><path d="m3 8 9-5 9 5-9 5-9-5Zm0 4 9 5 9-5M3 16l9 5 9-5"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v5m10-5v5M3 11h18"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  edit: <><path d="m14 6 4 4M4 20l4-1 12-12a2.8 2.8 0 0 0-4-4L4 15v5Z"/></>,
  wallet: <><path d="M19 8V5a1 1 0 0 0-1-1L5 7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2H5"/><path d="M21 13h-5v4h5"/></>,
  bolt: <><path d="m14 2-10 12h7l-1 8 10-13h-7l1-7Z"/></>,
  wifi: <><path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 4a6 6 0 0 1 8 0"/><circle cx="12" cy="20" r="1" /></>,
  home: <><path d="m2 11 10-8 10 8M5 10v11h14V10M10 21v-7h4v7"/></>,
  water: <><path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/><path d="M9 15a3 3 0 0 0 3 3"/></>,
  card: <><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/></>,
  play: <><rect x="3" y="4" width="18" height="16" rx="4"/><path d="m10 8 6 4-6 4V8Z"/></>,
  receipt: <><path d="M5 3l3 2 4-2 4 2 3-2v18l-3-2-4 2-4-2-3 2V3Z"/><path d="M9 9h6m-6 4h6"/></>,
  sort: <><path d="M4 6h16M4 12h11m-11 6h6"/></>,
  more: <><g fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></g></>,
};

export function Icon({ name }: { name: keyof typeof symbols }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {symbols[name]}
    </svg>
  );
}
