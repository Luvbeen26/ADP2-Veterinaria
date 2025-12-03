import { Component, inject, signal } from '@angular/core';
import { MatIcon, MatIconModule } from "@angular/material/icon";
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartOptions } from 'chart.js';
import { Statistics } from '../../../core/services/vet/statistics';
import { DashboardResponse } from '../../../core/models/statistics';

@Component({
  selector: 'app-estadisticas',
  imports: [MatIconModule, NgChartsModule],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.css'
})
export class Estadisticas {
  selectedChart = 'finanzas';
  statisticsService = inject(Statistics);
  statistics = signal<DashboardResponse | null>(null);
  ngOnInit(){
    this.statisticsService.getStatistics().subscribe({
      next:(data)=>{
        console.log(data);
        this.statistics.set(data);
        this.updateCharts(data);
      },
        error:(err)=>{
          console.log(err);
        }
    })
  }

   lineChartData: ChartConfiguration['data'] = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
    datasets: [
      {
        data: [45, 98, 68, 25, 95, 60],
        label: 'Nuevos clientes',
        fill: true,
        tension: 0.4, 
        borderColor: '#6A5AF9',
        backgroundColor: 'rgba(106, 90, 249, 0.2)',
        pointBackgroundColor: '#fff',
        pointBorderColor: '#6A5AF9',
        pointRadius: 6,
      }
    ]
  };

  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  pieChartData: ChartConfiguration['data'] = {
    labels: ['Perro', 'Gato'],
    datasets: [
      {
        data: [100,200],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)'
        ],
        borderWidth: 1
      }
    ]
  };

  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    }
  };

    barFinanceData: ChartData<'bar'> = {
      labels: [
          'Enero','Febrero','Marzo','Abril','Mayo','Junio',
          'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
      ],
      datasets: [
          {
              label: 'Consultas',
              data: [80000, 95000, 70000, 120000, 90000, 140000, 150000, 145000, 160000, 180000, 90000, 110000],
              backgroundColor: '#4E79A7'
          },
          {
              label: 'Salón de cuidados',
              data: [35000, 50000, 40000, 30000, 25000, 35000, 40000, 45000, 70000, 80000, 50000, 30000],
              backgroundColor: '#F28E2B'
          },
          {
              label: 'Adopción',
              data: [100000, 110000, 130000, 115000, 30000, 50000, 20000, 30000, 80000, 60000, 90000, 120000],
              backgroundColor: '#59A14F'
          }
      ]
  };
  barFinanceOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' as const }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#666' },
        grid: { color: '#eee' }
      },
      x: {
        ticks: { color: '#666' },
        grid: { display: false }
      }
    }
  };


  pieExpensesData: ChartData<'pie'> = {
      labels: ['Veterinarios', 'Servicios', 'Limpieza', 'Comida', 'Utilidades', 'Otros'],
      datasets: [{
          data: [769, 713, 354, 273, 270, 950],
          backgroundColor: [
              '#4E79A7', '#F28E2B', '#E15759',
              '#76B7B2', '#59A14F', '#EDC949'
          ]
      }]
  };
  pieExpensesOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' as const }
    }
  };

  profitability = [
      { name: 'Consultas', percent: 70.2, ingresos: '$240,000', costos: '$95,000' },
      { name: 'Adopción', percent: 70.2, ingresos: '$240,000', costos: '$95,000' },
      { name: 'Salón de cuidados', percent: 70.2, ingresos: '$240,000', costos: '$95,000' }
  ];

  topServices = [
      { name: 'Consultas generales', visits: 425, percent: 80, color: '#1F4FFF' },
      { name: 'Adopción', visits: 425, percent: 75, color: '#1DB954' },
      { name: 'Salón de cuidados', visits: 425, percent: 85, color: '#D82C2C' }
  ];
  serviceTrendData = {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [
          {
              label: 'Cirugías',
              data: [140000, 100000, 140000, 110000, 145000, 130000],
              fill: false,
              borderColor: '#1DB954',
              pointBackgroundColor: '#1DB954',
              tension: 0.35
          },
          {
              label: 'Consultas',
              data: [45000, 52000, 48000, 60000, 55000, 59000],
              fill: false,
              borderColor: '#1F4FFF',
              pointBackgroundColor: '#1F4FFF',
              tension: 0.35
          },
          {
              label: 'Estética',
              data: [35000, 38000, 36000, 42000, 40000, 45000],
              fill: false,
              borderColor: '#F8A52A',
              pointBackgroundColor: '#F8A52A',
              tension: 0.35
          }
      ]
  };


  serviceTrendOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#eee' },
        ticks: { color: '#777' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#777' }
      }
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { usePointStyle: true }
      }
    }
  };

    updateCharts(data: DashboardResponse) {

  // ------------------ LINE CHART ------------------
  this.lineChartData.labels = data.clientes_mascotas.nuevos_clientes_6_meses.map(c => c.mes);
  this.lineChartData.datasets[0].data = data.clientes_mascotas.nuevos_clientes_6_meses.map(c => c.total);

  // ------------------ PIE MASCOTAS ------------------
  this.pieChartData.labels = data.clientes_mascotas.mascotas_por_especie.map(m => m.especie);
  this.pieChartData.datasets[0].data = data.clientes_mascotas.mascotas_por_especie.map(m => m.total);

  // ------------------ BAR FINANZAS ------------------
  this.barFinanceData.labels = data.finanzas.ingreso_mensual_por_servicio.map(s => s.mes);

  this.barFinanceData.datasets = data.finanzas.ingreso_mensual_por_servicio.map(s => ({
    label: s.servicio,
    data: [s.total]
  }));

  // ------------------ PIE EGRESOS ------------------
  this.pieExpensesData.labels = data.finanzas.distribucion_egresos.map(e => e.motivo ?? 'Desconocido');
  this.pieExpensesData.datasets[0].data = data.finanzas.distribucion_egresos.map(e => e.total ?? 0);

  // ------------------ TOP SERVICIOS ------------------
  const totalVisitas = data.servicios.mas_solicitados
    .reduce((sum, s) => sum + s.visitas, 0);

  const colors = ['#1F4FFF', '#1DB954', '#D82C2C', '#F8A52A'];

  this.topServices = data.servicios.mas_solicitados.map((s, i) => ({
    name: s.servicio,
    visits: s.visitas,
    percent: totalVisitas > 0 ? Math.round((s.visitas / totalVisitas) * 100) : 0,
    color: colors[i % colors.length]
  }));

  // ------------------ RENTABILIDAD ------------------
  this.profitability = data.finanzas.rentabilidad_servicios.map(r => ({
    name: r.servicio,
    percent: r.porcentaje,
    ingresos: `$${r.ingresos}`,
    costos: `$${r.costos}`
  }));

  // ------------------ TENDENCIA SERVICIOS ------------------
  this.serviceTrendData.labels = data.servicios.tendencia_6_meses.map(t => t.mes);

  this.serviceTrendData.datasets = [
    {
      label: 'Ingresos últimos 6 meses',
      data: data.servicios.tendencia_6_meses.map(t => t.total),
      fill: false,
      borderColor: '#1F4FFF',
      pointBackgroundColor: '#1F4FFF',
      tension: 0.35
    }
  ];
}




  activeSelected(selected:string){
    this.selectedChart = selected;
  }
}
