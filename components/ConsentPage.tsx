import React from 'react';

interface ConsentPageProps {
  onGoBack: () => void;
}

export const ConsentPage: React.FC<ConsentPageProps> = ({ onGoBack }) => {
  return (
    <div className="w-full max-w-3xl p-6 md:p-8 bg-white rounded-lg shadow-xl mx-auto text-slate-700">
      <h2 className="text-2xl md:text-3xl font-bold text-sky-600 mb-6">Terms and Safety Considerations</h2>
      
      <div className="prose prose-sm sm:prose-base max-w-none">
        <ul className="list-disc list-outside space-y-2 pl-1">
          <li>The experiment was conducted in a controlled environment (SUIS Gubei, Room N104).</li>
          <li>All equipment (computer, speaker, and sound‐level sensor) was inspected before each session to ensure proper operation.</li>
          <li>Music volume was calibrated to safe listening levels (20–70 dB) using a Class 2 sound‐level meter.</li>
          <li>Participants confirmed they have no known hearing impairments or sensitivities to sound.</li>
          <li>A qualified first‐aid kit was stationed within 10 m of the testing area at all times.</li>
          <li>The school nurse’s office is located within 50 m and on standby for any medical needs.</li>
          <li>Emergency exits and fire‐safety routes were clearly marked and unobstructed.</li>
          <li>Participants may pause or withdraw from the experiment at any time without penalty.</li>
          <li>All data collected will be kept confidential and used solely for academic research purposes.</li>
        </ul>

        <p className="font-semibold mt-6">
          By checking the consent box on the previous page, you acknowledge that you have read, understood, and agree to abide by the above conditions.
        </p>
      </div>

      <button
        onClick={onGoBack}
        className="mt-8 px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-75"
      >
        Back to Form
      </button>
    </div>
  );
};