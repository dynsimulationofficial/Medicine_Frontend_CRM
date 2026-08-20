const fs = require('fs');

function updateFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove react-phone-input-2 imports
    content = content.replace(/import PhoneInput from "react-phone-input-2";\r?\n/g, '');
    content = content.replace(/import "react-phone-input-2\/lib\/style\.css";\r?\n/g, '');

    // Update Yup validation for mobile_number
    const oldYup = /mobile_number: Yup\.string\(\)[\s\S]*?\.required\("Mobile number is required"\),/g;
    const newYup = 'mobile_number: Yup.string().matches(/^(\\\+91\\\d{10}|\\\+1\\\d{10}|\\\+44\\\d{10,11})$/, "Invalid mobile number for selected country").required("Mobile number is required"),';
    content = content.replace(oldYup, newYup);

    // Initial Values
    content = content.replace(/mobile_number: "",/g, 'mobile_number: "+91",');
    content = content.replace(/mobile_number: selectedData\?\.mobile_number \|\| "",/g, 'mobile_number: selectedData?.mobile_number || "+91",');
    
    // Replace the PhoneInput component UI
    const phoneInputRegex = /<PhoneInput[\s\S]*?\/>/g;
    
    const newUI = \<div className="flex w-full h-[50px] border border-gray-700 rounded-[4px] bg-black overflow-hidden hover:shadow-hoverInputShadow focus-within:border-primary-600">
                            <select 
                              className="bg-black text-white border-r border-gray-700 px-3 outline-none"
                              value={values.mobile_number.startsWith('+1') ? '+1' : values.mobile_number.startsWith('+44') ? '+44' : '+91'}
                              onChange={(e) => {
                                const currentCode = values.mobile_number.startsWith('+1') ? '+1' : values.mobile_number.startsWith('+44') ? '+44' : '+91';
                                const numberPart = values.mobile_number.replace(currentCode, '');
                                setFieldValue('mobile_number', e.target.value + numberPart);
                              }}
                            >
                              <option value="+91">+91 (IN)</option>
                              <option value="+1">+1 (US)</option>
                              <option value="+44">+44 (UK)</option>
                            </select>
                            <input
                              type="text"
                              className="w-full bg-black text-white pl-4 outline-none placeholder-gray-400"
                              placeholder="Enter mobile number"
                              value={(() => {
                                const code = values.mobile_number.startsWith('+1') ? '+1' : values.mobile_number.startsWith('+44') ? '+44' : '+91';
                                return values.mobile_number.substring(code.length);
                              })()}
                              onChange={(e) => {
                                const code = values.mobile_number.startsWith('+1') ? '+1' : values.mobile_number.startsWith('+44') ? '+44' : '+91';
                                const digitsOnly = e.target.value.replace(/\\D/g, '');
                                setFieldValue('mobile_number', code + digitsOnly);
                              }}
                            />
                          </div>\;
                          
    content = content.replace(phoneInputRegex, newUI);
    
    fs.writeFileSync(file, content);
}

updateFile('app/useradd/page.tsx');
updateFile('app/usermanagement/page.tsx');

console.log('updated both files');
