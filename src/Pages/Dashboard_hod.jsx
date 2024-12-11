import axios from 'axios';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import PieChartComponent from '../Components/Department-Component/FacultyCountPieChart';
import StudentCountPieChart from '../Components/Department-Component/StudentsCountPieChart';
import PlacementBarGraph from '../Components/Department-Component/PlacementBarGraph';
import CustomBar from './CustomBar';
import CustomPie from './CustomPie';
import { Link, Navigate } from 'react-router-dom'; 
import { getTokenData } from './authUtils';
import { Bar, Pie, Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto'; 
import 'chartjs-plugin-datalabels';
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.register(ChartDataLabels);

const generateAbbreviation = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('');
};
const renderGraphInUI = (graph) => {
  const ChartWrapper = ({ children }) => (
    <div style={{ 
      width: '100%', 
      height: window.innerWidth < 768 ? '300px' : '400px',
      position: 'relative' 
    }}>
      {children}
    </div>
  );

  let chartData, options;

  switch (graph.graph_type) {
    case 'line':
      chartData = {
        labels: graph.data.map(item => item.abbreviated || item.name),
        datasets: [{
          label: graph.title || 'Line Chart',
          data: graph.data.map(item => item.value),
          borderColor: getColorForDataset(0),
          backgroundColor: getColorForDataset(0, 1),
          fill: false,
          tension: 0.1
        }]
      };

      options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: function(context) {
                const dataIndex = context.dataIndex;
                const fullName = graph.data[dataIndex].name;
                const label = context.dataset.label || '';
                const value = context.parsed.y || '';
                return `${fullName}: ${value}`;
              },
              title: function(context) {
                const dataIndex = context[0].dataIndex;
                return graph.data[dataIndex].name;
              }
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Categories' } },
          y: { title: { display: true, text: 'Values' } }
        }
      };

      return (
        <ChartWrapper>
          <Line data={chartData} options={options} />
        </ChartWrapper>
      );

    case 'pie':
      const totalValue = graph.data.reduce((sum, item) => sum + item.value, 0);
      chartData = {
        labels: graph.data.map(item => item.abbreviated || item.name),
        datasets: [{
          data: graph.data.map(item => item.value),
          backgroundColor: graph.data.map((_, index) => getColorForDataset(index)),
          borderColor: graph.data.map((_, index) => getColorForDataset(index, 1)),
          borderWidth: 1
        }]
      };

      options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' },
          tooltip: {
            callbacks: {
              label: function(context) {
                const dataIndex = context.dataIndex;
                const fullName = graph.data[dataIndex].name;
                const value = context.parsed || '';
                const percentage = ((graph.data[dataIndex].value / totalValue) * 100).toFixed(1) + '%';
                return `${fullName}: ${percentage}`;
              }
            },
          },
          datalabels: {
            color: 'white',
            font: { weight: 'bold', size: 12 },
            formatter: (value, context) => {
              const percentage = ((value / totalValue) * 100).toFixed(1) + '%';
              return percentage;
            },
            anchor: 'center',
            align: 'center',
            display: (context) => {
              const percentage = ((context.dataset.data[context.dataIndex] / totalValue) * 100);
              return percentage > 3;
            }
          }
        }
      };

      return (
        <ChartWrapper>
          <Pie data={chartData} options={options} plugins={[ChartDataLabels]} />
        </ChartWrapper>
      );

    case 'bar':
      if (graph.data.length > 0 && graph.data[0].values) {
        chartData = {
          labels: graph.data.map(item => item.abbreviated || item.name),
          datasets: Object.keys(graph.data[0].values).map((key, index) => ({
            label: key,
            data: graph.data.map(item => item.values[key]),
            backgroundColor: getColorForDataset(index),
            borderColor: getColorForDataset(index, 1),
            borderWidth: 1,
          }))
        };

        options = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: graph.title || 'Stacked Bar Chart' },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const datasetLabel = context.dataset.label;
                  const dataIndex = context.dataIndex;
                  const fullName = graph.data[dataIndex].name;
                  const value = context.parsed.y;
                  return `${datasetLabel} (${fullName}): ${value}`;
                },
                title: function(context) {
                  return graph.data[context[0].dataIndex].name;
                }
              }
            },
            legend: {
              labels: {
                font: {
                  size: (context) => {
                    const screenWidth = window.innerWidth;
                    return screenWidth < 768 ? 10 : 14;
                  }
                }
              }
            }
          },
          scales: {
            x: {
              stacked: true,
              ticks: {
                autoSkip: true,
                maxRotation: 45,
                font: {
                  size: (context) => {
                    const screenWidth = window.innerWidth;
                    return screenWidth < 768 ? 8 : 12;
                  }
                }
              }
            },
            y: {
              stacked: true,
              ticks: {
                font: {
                  size: (context) => {
                    const screenWidth = window.innerWidth;
                    return screenWidth < 768 ? 8 : 12;
                  }
                }
              }
            }
          }
        };

        return (
          <ChartWrapper>
            <Bar data={chartData} options={options} />
          </ChartWrapper>
        );
      }
      break;

    default:
      return <p>Unsupported graph type: {graph.graph_type}</p>;
  }
};

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
`;

const DropDown = styled.select`
  margin: 10px;
  background-color: #4D4D4D;
  border-radius: 8px;
  color: white;
  padding: 8px 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover {
    background-color: #3c3c3c;
  }
  &:focus {
    outline: none;
  }
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  width: 100%;
  max-width: 1400px;
  padding: 20px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const GridItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: white;
  border-radius: 40px;
  height: 450px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: powderblue;
  margin-bottom: 10px;
`;

const CuteButton = styled.button`
  margin-top: 10px;
  background-color: #164863;
  border: none;
  border-radius: 12px;
  color: white;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover {
    background-color: #133b5c;
    transform: translateY(-2px);
  }
  &:active {
    background-color: #164863;
    transform: translateY(0);
  }
`;
const getColorForDataset = (index, alpha = 0.9) => {
  const COLORS = [
    "#FF6666",
    "#FFB366",
    "#FF9933",
    "#80E6B3",
    "#66CCCC",
    "#9999FF",
    "#FF66FF",
    "#66FF66",
    "#FFB300",
    "#FF80AA"
  ];
  const colors = COLORS.map(color => {
    const [r, g, b] = color
      .match(/\w\w/g) // Extract hexadecimal components
      .map(hex => parseInt(hex, 16)); // Convert to RGB values
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  });
  return colors[index % colors.length];
};
function DashBoard_hod() {
  const tokenData = getTokenData();
  if (!tokenData) {
    return <Navigate to="/" />;
  }

  const { department, userId } = tokenData;
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [studentDetails, setStudentDetails] = useState([]);
  const [facultyDetails, setFacultyDetails] = useState([]);
  const [studentYrsDetails, setStudentYrsDetails] = useState([]);
  const [customGraphs, setCustomGraphs] = useState([]);

  useEffect(() => {
    fetchAcademicYears();
    fetchCustomGraphs(userId);
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const response = await axios.post("http://localhost:3000/graphs/academicyear");
      const years = response.data;
      setAcademicYears(years);
      const defaultYear = years[years.length - 1];
      setSelectedYear(defaultYear);
      fetchStudentData(defaultYear);
      fetchStaffData();
      fetchStudentyrsData(defaultYear);
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  const fetchCustomGraphs = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:3000/dashboard/getgraphs/${userId}`);
      setCustomGraphs(response.data.graphs);
    } catch (error) {
      console.error("Error fetching custom graphs:", error);
    }
  };

  const handleYearChange = (event) => {
    const year = event.target.value;
    setSelectedYear(year);
    fetchStudentData(year);
    fetchStudentyrsData(year);
  };

  const fetchStudentData = async (year) => {
    try {
      const response = await axios.post("http://localhost:3000/graphs/studentsgraph", { dept: department, academic_year: year });
      setStudentDetails(transformData(response.data));
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const transformData = (data) => [
    { status: 'Placed', students: data.placed_students },
    { status: 'Yet Placed', students: data.yet_placed_students },
    { status: 'HS', students: data.higher_studies_students },
  ];

  const fetchStaffData = async () => {
    try {
      const response = await axios.post("http://localhost:3000/graphs/staffgraph", { dept: department });
      setFacultyDetails(transformStaffData(response.data));
    } catch (error) {
      console.error('Error fetching staff data:', error);
    }
  };

  const transformStaffData = (data) => [
    { name: "Professor", value: data.Professor },
    { name: "Associate Professor", value: data.Associate_Professor },
    { name: "Assistant Professor", value: data.Assistant_Professor },
  ];

  const fetchStudentyrsData = async (year) => {
    try {
      const response = await axios.post("http://localhost:3000/graphs/studentsyrsgraph", { dept: department, academic_year: year });
      setStudentYrsDetails(transformYrsData(response.data));
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const transformYrsData = (data) => [
    { name: "1st Year", value: data.firstyear },
    { name: "2nd Year", value: data.secondyear },
    { name: "3rd Year", value: data.thirdyear },
    { name: "4th Year", value: data.fourthyear },
  ];

  const customTransformData = (data) => data.map(item => ({ name: item.name, value: item.value }));

  const renderGraph = (graph) => {
    switch (graph.graph_type) {
      case 'pie':
        return <CustomPie data={customTransformData(graph.data)} colorSettings={graph.colorSettings} />;
      case 'bar':
        return <CustomBar data={customTransformData(graph.data)} colorSettings={graph.colorSettings} />;
      default:
        return <p>Unsupported graph type: {graph.graph_type}</p>;
    }
  };

  return (
    <DashboardContainer>
      <DropDown value={selectedYear} onChange={handleYearChange}>
        {academicYears.map((year, index) => (
          <option key={index} value={year}>{year}</option>
        ))}
      </DropDown>

      <GridContainer>
        <GridItem>
          <Title>Faculty</Title>
          <PieChartComponent data={facultyDetails} />
        </GridItem>
        <GridItem>
          <Title>Placement</Title>
          <PlacementBarGraph Details={studentDetails} />
          <Link to="Placements">
            <CuteButton>View</CuteButton>
          </Link>
        </GridItem>
        <GridItem>
          <Title>Student</Title>
          <StudentCountPieChart data={studentYrsDetails} />
        </GridItem>
        {customGraphs.map((graph, index) => (
          <GridItem key={index}>
            <Title>{graph.config_name}</Title>
            {renderGraphInUI(graph)}
          </GridItem>
        ))}
      </GridContainer>
    </DashboardContainer>
  );
}

export default DashBoard_hod;
