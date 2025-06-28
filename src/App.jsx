import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './App.css';

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

const BASE_API = 'https://api.exchangerate.host';

export default function App() {
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('ILS');
  const [converted, setConverted] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);

  useEffect(() => {
    if (amount && !isNaN(amount)) {
      fetchLatestRate();
      fetchHistoricalRates();
    }
  }, [amount, fromCurrency]);

  const fetchLatestRate = async () => {
    const res = await fetch(`${BASE_API}/latest?base=${fromCurrency}&symbols=${toCurrency}`);
    const data = await res.json();
    const rate = data.rates[toCurrency];
    setConverted((parseFloat(amount) * rate).toFixed(2));
  };

  const fetchHistoricalRates = async () => {
    const years = [...Array(10)].map((_, i) => new Date().getFullYear() - i);
    const requests = years.map((year) =>
      fetch(`${BASE_API}/${year}-06-01?base=${fromCurrency}&symbols=${toCurrency}`)
    );
    const responses = await Promise.all(requests);
    const data = await Promise.all(responses.map((r) => r.json()));

    const chartData = data.map((d, i) => {
      const rate = d.rates[toCurrency];
      return {
        year: years[i],
        rate: rate,
        converted: (parseFloat(amount) * rate).toFixed(2),
      };
    }).reverse();

    setHistoricalData(chartData);
  };

  const handleAmountChange = (e) => setAmount(e.target.value);
  const handleFromChange = (e) => {
    setFromCurrency(e.target.value);
    setToCurrency(e.target.value === 'USD' ? 'ILS' : 'USD');
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const data = historicalData[context.dataIndex];
            return `${amount} ${fromCurrency} = ${data.converted} ${toCurrency} (rate: ${data.rate})`;
          },
        },
      },
    },
  };

  const chartData = {
    labels: historicalData.map((d) => d.year),
    datasets: [
      {
        label: `${amount || 0} ${fromCurrency} in ${toCurrency}`,
        data: historicalData.map((d) => d.converted),
        fill: false,
        borderColor: 'blue',
        tension: 0.2,
      },
    ],
  };

  return (
    <div className="container">
      <h1>USD / ILS Currency Tracker</h1>
      <div className="form">
        <input type="number" value={amount} onChange={handleAmountChange} placeholder="Enter amount" />
        <select value={fromCurrency} onChange={handleFromChange}>
          <option value="USD">USD</option>
          <option value="ILS">ILS</option>
        </select>
      </div>
      {converted && (
        <p>
          Converted: <strong>{converted} {toCurrency}</strong>
        </p>
      )}
      {historicalData.length > 0 && <Line data={chartData} options={chartOptions} />}
    </div>
  );
}