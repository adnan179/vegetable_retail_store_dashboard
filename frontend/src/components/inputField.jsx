import React from "react";

const InputField = ({ label, type = "text", placeholder, value, onChange,inputRef }) => {
  return (
    <div className="flex flex-col w-[300px]">
      {label && <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        ref={inputRef ? inputRef : undefined}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="px-4 py-2 text-black bg-[#d9d9d9] rounded"
        required
      />
    </div>
  );
};

export default InputField;
