document.addEventListener('DOMContentLoaded', () => {
    let jsPDF = window.jspdf?.jsPDF || window.jsPDF;
    let html2canvas = window.html2canvas;

    // Product Inputs
    const productNameInput = document.getElementById('productName');
    const productQuantityInput = document.getElementById('productQuantity');
    const productPriceInput = document.getElementById('productPrice');
    const deliveryChargeInput = document.getElementById('deliveryCharge');
    const productImageFileInput = document.getElementById('productImageFile');
    const productFileNameDisplay = document.getElementById('productFileNameDisplay');
    const colorSwatchesContainer = document.querySelector('.color-swatches');

    // Customer Inputs
    const customerNameInput = document.getElementById('customerName');
    const customerPhoneInput = document.getElementById('customerPhone');
    const customerAddressInput = document.getElementById('customerAddress');

    // Preview & Output
    const livePreviewBox = document.getElementById('livePreviewBox');
    const livePreviewImage = document.getElementById('livePreviewImage');
    const livePreviewColorText = document.getElementById('livePreviewColorText');
    const selectedColorNameDisplay = document.getElementById('selectedColorName');
    const outputFormatSelect = document.getElementById('outputFormat');
    const generateSlipBtn = document.getElementById('generateSlipBtn');
    const loadingMessage = document.getElementById('loadingMessage');
    const slipOutputContainer = document.getElementById('slipOutput');
    const currentYearSpan = document.getElementById('currentYear');

    let selectedColorName = null;
    let selectedColorValue = null;
    let uploadedProductImageDataUrl = null;

    const availableColors = [
        { name: 'হলুদ', value: 'yellow' }, { name: 'নীল', value: 'blue' },
        { name: 'সাদা', value: 'white' }, { name: 'কালো', value: 'black' },
        { name: 'সবুজ', value: 'green' }, { name: 'মেরুন', value: 'maroon' },
        { name: 'ম্যাজেন্টা', value: 'magenta' }, { name: 'আকাশি', value: 'skyblue' }, // Shortened for swatch
        { name: 'ক্রিম', value: 'ivory' }, { name: 'লাল', value: 'red' },
        { name: 'কমলা', value: 'orange' }
    ];

    // Fixed Business Details
    const businessLogoPath = 'logo.png'; // IMPORTANT: Place logo.png in the same folder or provide correct path
    const businessName = 'তাত-কথা';
    const businessAddress = 'সখিপুর, টাংগাইল';
    const businessPhone = '০১৭৬৮৪৮১৫০৫';

    function init() {
        jsPDF = window.jspdf?.jsPDF || window.jsPDF;
        html2canvas = window.html2canvas;

        if (!jsPDF || !html2canvas) {
            console.error("jsPDF or html2canvas not loaded!");
            alert("প্রয়োজনীয় লাইব্রেরি (jsPDF অথবা html2canvas) লোড হয়নি। স্লিপ তৈরি করা যাবে না।");
            generateSlipBtn.disabled = true;
            const btnTextSpan = generateSlipBtn.querySelector('span');
            if(btnTextSpan) btnTextSpan.textContent = "লাইব্রেরি ত্রুটি";
            else generateSlipBtn.textContent = "লাইব্রেরি ত্রুটি";
        }

        renderColorSwatches();
        updateLivePreview();
        slipOutputContainer.innerHTML = '<p class="empty-slip">উপরে তথ্য দিন এবং স্লিপ প্রিভিউ দেখতে "তৈরি করুন" বাটনে ক্লিক করুন।</p>';
        slipOutputContainer.classList.add('empty-slip');
        if(currentYearSpan) currentYearSpan.textContent = new Date().getFullYear().toLocaleString('bn-BD');

    }

    function renderColorSwatches() {
        availableColors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.classList.add('color-swatch');
            if (['white', 'ivory', 'yellow', 'skyblue'].includes(color.value)) {
                swatch.classList.add(color.value.replace(' ', '-'));
            }
            swatch.style.backgroundColor = color.value;
            swatch.dataset.colorName = color.name;
            swatch.dataset.colorValue = color.value;
            swatch.title = color.name;

            const colorNameSpan = document.createElement('span');
            colorNameSpan.textContent = color.name.substring(0,1);
            swatch.appendChild(colorNameSpan);

            swatch.addEventListener('click', () => {
                document.querySelectorAll('.color-swatch.selected').forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
                selectedColorName = color.name;
                selectedColorValue = color.value;
                updateLivePreview();
            });
            colorSwatchesContainer.appendChild(swatch);
        });
    }


    productImageFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedProductImageDataUrl = e.target.result;
                updateLivePreview();
            };
            reader.readAsDataURL(file);
            productFileNameDisplay.textContent = file.name;
            productFileNameDisplay.title = file.name;
        } else {
            uploadedProductImageDataUrl = null;
            productFileNameDisplay.textContent = "কোনো ছবি নেই";
            productFileNameDisplay.title = "";
            updateLivePreview();
        }
    });

    function updateLivePreview() {
        if (uploadedProductImageDataUrl) {
            livePreviewImage.src = uploadedProductImageDataUrl;
            livePreviewImage.style.display = 'block';
            livePreviewColorText.style.display = 'none';
        } else {
            livePreviewImage.style.display = 'none';
            livePreviewImage.src = "#";
            livePreviewColorText.style.display = 'inline';
            livePreviewColorText.textContent = "কোনো ছবি/রঙ নেই";
        }

        if (selectedColorValue) {
            livePreviewBox.style.backgroundColor = selectedColorValue;
            selectedColorNameDisplay.textContent = selectedColorName;
            const darkColors = ['black', 'maroon', 'blue', 'green'];
            livePreviewColorText.style.color = darkColors.includes(selectedColorValue) ? 'white' : 'black';
        } else {
            livePreviewBox.style.backgroundColor = '#f0f0f0';
            selectedColorNameDisplay.textContent = 'নেই';
            livePreviewColorText.style.color = 'black';
        }
    }

    generateSlipBtn.addEventListener('click', async () => {
        if (!jsPDF || !html2canvas) {
             alert("প্রয়োজনীয় লাইব্রেরি লোড হয়নি। স্লিপ তৈরি করা যাবে না।");
             return;
        }

        const productName = productNameInput.value.trim();
        const productQuantity = parseInt(productQuantityInput.value);
        const pricePerPiece = parseFloat(productPriceInput.value);
        const deliveryCharge = parseFloat(deliveryChargeInput.value) || 0;

        const customerName = customerNameInput.value.trim();
        const customerPhone = customerPhoneInput.value.trim();
        const customerAddress = customerAddressInput.value.trim();

        if (!productName) { alert('অনুগ্রহ করে পণ্যের নাম লিখুন।'); productNameInput.focus(); return; }
        if (isNaN(productQuantity) || productQuantity <= 0) { alert('অনুগ্রহ করে সঠিক পরিমাণ লিখুন।'); productQuantityInput.focus(); return; }
        if (isNaN(pricePerPiece) || pricePerPiece < 0) { alert('অনুগ্রহ করে প্রতিটির সঠিক মূল্য লিখুন।'); productPriceInput.focus(); return; }
        if (isNaN(deliveryCharge) || deliveryCharge < 0) { alert('অনুগ্রহ করে সঠিক ডেলিভারি চার্জ লিখুন (অথবা ০)।'); deliveryChargeInput.focus(); return; }
        if (!selectedColorName) { alert('অনুগ্রহ করে পণ্যের রঙ নির্বাচন করুন।'); return; }
        if (!customerName) { alert('অনুগ্রহ করে গ্রাহকের নাম লিখুন।'); customerNameInput.focus(); return; }
        if (!customerPhone) { alert('অনুগ্রহ করে গ্রাহকের ফোন নম্বর লিখুন।'); customerPhoneInput.focus(); return; }
        if (!customerAddress) { alert('অনুগ্রহ করে গ্রাহকের ঠিকানা লিখুন।'); customerAddressInput.focus(); return; }


        const subtotal = productQuantity * pricePerPiece;
        const grandTotal = subtotal + deliveryCharge;

        const slipDateTime = new Date();
        const orderId = `ORD-${slipDateTime.getTime().toString().slice(-6)}`;
        const issueDate = slipDateTime.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });

        const toBengaliNumber = (numStr) => {
            const engToBn = {'0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯', '.':'.'};
            return String(numStr).replace(/[0-9.]/g, (match) => engToBn[match] || match);
        };

        slipOutputContainer.innerHTML = `
            <div class="slip-invoice-header">
                <div class="slip-logo-container">
                    <img src="${businessLogoPath}" alt="লোগো - ${businessName}">
                </div>
                <div class="slip-business-details">
                    <h3>${businessName}</h3>
                    <p>${businessAddress}</p>
                    <p>যোগাযোগ: ${businessPhone}</p>
                </div>
            </div>

            <div class="slip-title-section">
                <h2>অর্ডার স্লিপ</h2>
            </div>

            <div class="slip-meta-info">
                <p><strong>অর্ডার আইডি:</strong> ${orderId}</p>
                <p><strong>ইস্যু তারিখ:</strong> ${issueDate}</p>
            </div>

            <div class="slip-customer-details">
                <h4>গ্রাহকের বিবরণ:</h4>
                <p><strong>নাম:</strong> ${customerName}</p>
                <p><strong>ফোন:</strong> ${customerPhone}</p>
                <p><strong>ঠিকানা:</strong> ${customerAddress}</p>
            </div>

            <table class="slip-items-table">
                <thead>
                    <tr>
                        ${uploadedProductImageDataUrl ? '<th>ছবি</th>' : ''}
                        <th> বিবরণ</th>
                        <th>রঙ</th>
                        <th class="numerical">পরিমাণ</th>
                        <th class="numerical">একক মূল্য</th>
                        <th class="numerical">মোট</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        ${uploadedProductImageDataUrl ? `<td class="item-image-cell"><img src="${uploadedProductImageDataUrl}" alt="${productName}" class="slip-product-image" style="background-color: ${selectedColorValue || '#f0f0f0'};"></td>` : ''}
                        <td class="item-name">${productName}</td>
                        <td>
                            ${selectedColorName}
                            <span class="item-color-swatch-table" style="background-color: ${selectedColorValue};"></span>
                        </td>
                        <td class="numerical">${toBengaliNumber(productQuantity)}</td>
                        <td class="numerical">৳${toBengaliNumber(pricePerPiece.toFixed(2))}</td>
                        <td class="numerical">৳${toBengaliNumber((productQuantity * pricePerPiece).toFixed(2))}</td>
                    </tr>
                </tbody>
            </table>

            <div class="slip-totals-section">
                <p><strong>সাবটোটাল:</strong> <span>৳${toBengaliNumber(subtotal.toFixed(2))}</span></p>
                <p><strong>ডেলিভারি চার্জ:</strong> <span>৳${toBengaliNumber(deliveryCharge.toFixed(2))}</span></p>
                <p class="slip-grand-total"><strong>সর্বমোট:</strong> <span>৳${toBengaliNumber(grandTotal.toFixed(2))}</span></p>
            </div>

            <div class="slip-footer-notes">
                <p>আপনার অর্ডারের জন্য ধন্যবাদ! কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন।</p>
                <p>পণ্য গ্রহণের সময় মূল্য পরিশোধ করুন।</p>
            </div>
        `;
        slipOutputContainer.classList.remove('empty-slip');

        loadingMessage.style.display = 'inline';
        generateSlipBtn.disabled = true;

        try {
            await new Promise(resolve => setTimeout(resolve, 300));

            const canvas = await html2canvas(slipOutputContainer, {
                scale: 3.0,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                imageTimeout: 15000,
                removeContainer: false,
            });

            const format = outputFormatSelect.value;
            const filenameTimestamp = slipDateTime.toISOString().replace(/[:.T-]/g, '').substring(0, 14);
            const filename = `OrderSlip_${productName.replace(/[\s Bengali characters for filename might be problematic]/g, '_').substring(0,15)}_${filenameTimestamp}.${format}`;


            if (format === 'jpg') {
                const imageData = canvas.toDataURL('image/jpeg', 0.95);
                downloadURI(imageData, filename);
            } else if (format === 'pdf') {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: [canvas.width, canvas.height]
                });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                pdf.save(filename);
            }
        } catch (error) {
            console.error('স্লিপ তৈরিতে ত্রুটি:', error);
            alert('স্লিপ তৈরিতে ব্যর্থ হয়েছে। বিস্তারিত জানতে কনসোল চেক করুন। নিশ্চিত করুন "logo.png" ফাইলটি সঠিক স্থানে আছে।');
        } finally {
            loadingMessage.style.display = 'none';
            generateSlipBtn.disabled = false;
        }
    });

    function downloadURI(uri, name) {
        const link = document.createElement('a');
        link.download = name;
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    init();
});