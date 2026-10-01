export function numberToWords(number) {
  const first = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const num = parseInt(number, 10);
  if (isNaN(num) || num < 0) return 'Invalid Number';
  if (num === 0) return 'Zero';

  if (num > 999999999) return 'Number too large';

  const convert = (n) => {
    if (n < 20) return first[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + first[n % 10] : '');
    if (n < 1000) return first[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    return '';
  };

  let word = '';
  let crore = Math.floor(num / 10000000);
  let lakh = Math.floor((num % 10000000) / 100000);
  let thousand = Math.floor((num % 100000) / 1000);
  let remainder = num % 1000;

  if (crore > 0) word += convert(crore) + ' Crore ';
  if (lakh > 0) word += convert(lakh) + ' Lakh ';
  if (thousand > 0) word += convert(thousand) + ' Thousand ';
  if (remainder > 0) word += convert(remainder);

  return word.trim() + ' Rupees Only';
}
