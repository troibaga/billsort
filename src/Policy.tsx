import { useEffect } from 'react';

export function PolicyLinks() {
  return <footer className="account-policy-links">
    <a href="#terms">Terms of use</a>
    <a href="#privacy">Privacy policy</a>
  </footer>;
}

export function Policy({ privacy }: { privacy: boolean }) {
  const title = privacy ? 'Privacy policy' : 'Terms of use';
  useEffect(() => {
    const previous = document.title;
    document.title = title + ' | BillWise';
    window.scrollTo(0, 0);
    return () => { document.title = previous; };
  }, [title]);

  return <div className="account-page">
    <header><div className="account-bar">
      <a className="brand" href="/"><img width="42" height="42" src="/icons/billsort-192.png" alt="" />BillWise</a>
      <a href="#app">Open app</a>
    </div></header>
    <main key={title} className="policy-main page-enter"><article className="account-card policy-copy">
      <h1>{title}</h1>
      {privacy ? <>
        <h2>Your bills and pay schedule</h2>
        <p>BillWise saves bill names, amounts, due dates, payment status and paycheck settings in this browser under your account ID. Your entries stay on this device. Another browser or device has its own plan.</p>
        <h2>Your sign-in information</h2>
        <p>Supabase processes your email and sign-in credentials to authenticate you. If you choose Google, Google authenticates you and shares account information, including your email, with Supabase. BillWise uses your account ID to open your local plan and shows your email on the account page.</p>
        <p>The browser stores session tokens so you can return while signed in. Logging out ends this browser’s session. Your saved plan stays here for your next visit.</p>
        <h2>Protecting and removing your data</h2>
        <p>Someone with access to your browser profile can inspect its local storage. Use a private device or a separate browser profile for sensitive bills, and log out when you finish.</p>
        <p>You can edit or delete individual bills in the planner. Clearing BillWise site data in your browser removes all plans and sign-in information saved in that browser. Your Supabase account continues to exist.</p>
        <p>Read the <a href="https://supabase.com/privacy">Supabase Privacy Policy</a> and <a href="https://policies.google.com/privacy">Google Privacy Policy</a> for details about those services.</p>
      </> : <>
        <h2>Using the planner</h2>
        <p>Use BillWise to organize bills and estimate what your paycheck will cover. Check amounts, due dates and payment instructions with your biller. Marking a bill as paid records your entry in the planner. You still need to make the payment through your biller.</p>
        <h2>Your account</h2>
        <p>Use an account you control. Keep your sign-in details private and enter only information you are entitled to store. BillWise requires a signed-in session to open a plan.</p>
        <h2>Your records</h2>
        <p>Keep a separate copy of important records. BillWise stores your plan in this browser, and clearing site data or losing the device can erase your copy. The <a href="#privacy">privacy policy</a> explains how sign-in and storage work.</p>
      </>}
      <PolicyLinks />
    </article></main>
  </div>;
}
