import { useState, useEffect } from "react";
import {
  BarChart,
  LineChart,
  Activity,
  Globe,
  BookOpen,
  Share2,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useApiCall } from "@/services/api/useApiCall";
import { carbonApi } from "@/services/api/carbonApi";
import GlobalEmissions from "./globalEmission";
import { useNavigate } from "react-router-dom";
import Navigation, { useEmissions } from "./Navigation";
import { resources } from "./Resources";

const Dashboard = () => {
  const navigate = useNavigate();
  const { emissionsHistory, addEmission } = useEmissions();

  const {
    data,
    loading,
    error,
    execute: calculateEmissions,
  } = useApiCall(carbonApi.calculateVehicleEmissions);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const currentMonthEmissions = emissionsHistory
    .filter((emission) => {
      const emissionDate = new Date(emission.date);
      return (
        emissionDate.getMonth() === currentMonth &&
        emissionDate.getFullYear() === currentYear
      );
    })
    .reduce((total, emission) => total + emission.amount, 0);

  const [globalStats, setGlobalStats] = useState({
    emissions: "Loading...",
    impact: currentMonthEmissions.toFixed(1),
    resources: resources.length.toString(),
    community: "128",
  });

  useEffect(() => {
    setGlobalStats((prev) => ({
      ...prev,
      impact: currentMonthEmissions.toFixed(1),
    }));
  }, [currentMonthEmissions]);

  const handleCalculate = async (e) => {
    e.preventDefault();
    const selectedActivity = document.querySelector("select").value;
    const distanceValue =
      parseFloat(document.querySelector("input[type='number']").value) || 100;

    try {
      switch (selectedActivity) {
        case "vehicle":
          const vehicleResult = await calculateEmissions({
            distance_value: distanceValue,
            vehicle_model_id: "7268a9b7-17e8-4c8d-acca-57059252afe9", // Default vehicle (medium car)
            distance_unit: "km",
          });

          // Add to emissions history if calculation was successful
          if (vehicleResult?.data?.attributes?.carbon_kg) {
            addEmission({
              activity: "vehicle",
              amount: vehicleResult.data.attributes.carbon_kg,
              details: { distance: distanceValue, unit: "km" },
            });
          }
          break;

        case "flight":
          alert("Please use the Calculator page for full flight emissions");
          navigate("/calculator");
          break;

        case "electricity":
          alert("Please use the Calculator page for full energy emissions");
          navigate("/calculator");
          break;

        default:
          alert("Please select an activity");
      }
    } catch (error) {
      console.error("Calculation error:", error);
    }
  };

  const handleEmissionsUpdate = (emissionsValue) => {
    setGlobalStats((prev) => ({
      ...prev,
      emissions: emissionsValue,
    }));
  };

  // Calculate weekly emissions data with default values
  const getWeeklyEmissions = () => {
    const defaultWeeklyValues = [40, 38, 45, 35, 40, 38]; // Default values that show a realistic pattern
    const now = new Date();

    // Create an array of the last 6 weeks
    const weeklyData = Array.from({ length: 6 }, (_, i) => {
      const weekStart = new Date(
        now.getTime() - (5 - i) * 7 * 24 * 60 * 60 * 1000
      );
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Filter emissions for this week
      const weeklyEmissions = emissionsHistory.filter((emission) => {
        const emissionDate = new Date(emission.date);
        return emissionDate >= weekStart && emissionDate < weekEnd;
      });

      // Sum emissions for the week, use default if no data
      const totalEmissions =
        weeklyEmissions.length > 0
          ? weeklyEmissions.reduce((sum, emission) => sum + emission.amount, 0)
          : defaultWeeklyValues[i];

      return {
        name: `Week ${i + 1}`,
        emissions: totalEmissions,
      };
    });

    return weeklyData;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalEmissions onEmissionsUpdate={handleEmissionsUpdate} />
      <Navigation />
      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Global Emissions
              </CardTitle>
              <Globe className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.emissions}</div>
              <p className="text-xs text-gray-500">metric tons CO2</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Your Impact</CardTitle>
              <Activity className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.impact}</div>
              <p className="text-xs text-gray-500">kg CO2 this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resources</CardTitle>
              <BookOpen className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.resources}</div>
              <p className="text-xs text-gray-500">articles available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Community</CardTitle>
              <Share2 className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.community}</div>
              <p className="text-xs text-gray-500">active pledges</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calculator Section */}
          <Card>
            <CardHeader>
              <CardTitle>Carbon Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <select className="w-full p-2 border rounded">
                  <option>Select Activity</option>
                  <option value="vehicle">Driving</option>
                  <option value="flight">Flying</option>
                  <option value="electricity">Home Energy</option>
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Distance/Usage"
                    className="p-2 border rounded"
                  />
                  <button
                    onClick={handleCalculate}
                    disabled={loading}
                    className="bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:bg-green-300"
                  >
                    {loading ? "Calculating..." : "Calculate"}
                  </button>
                </div>
                {error && <div className="text-red-500 text-sm">{error}</div>}
                {data && (
                  <div className="mt-4 p-4 bg-gray-50 rounded">
                    <h4 className="font-semibold">Results:</h4>
                    <p>
                      Carbon Emissions: {data.data.attributes.carbon_kg} kg CO2
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Emissions Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Your Emissions Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={getWeeklyEmissions()}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis
                      label={{
                        value: "CO₂ (kg)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="emissions"
                      stroke="#16a34a"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
