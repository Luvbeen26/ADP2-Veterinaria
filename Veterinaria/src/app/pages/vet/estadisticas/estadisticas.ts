import { Component, inject, signal } from '@angular/core';
import { MatIcon, MatIconModule } from "@angular/material/icon";
import { NgChartsModule } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, ChartOptions } from 'chart.js';
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
    Chart.defaults.font.family = 'Source Sans 3, sans-serif';
    Chart.defaults.color = '#52645f';
    Chart.defaults.borderColor = '#ccd8d3';
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
        borderColor: '#146B62',
        backgroundColor: 'rgba(20, 107, 98, 0.12)',
        pointBackgroundColor: '#fff',
        pointBorderColor: '#146B62',
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
          '#146B62',
          '#A96B22'
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
              backgroundColor: '#146B62'
          },
          {
              label: 'Salón de cuidados',
              data: [35000, 50000, 40000, 30000, 25000, 35000, 40000, 45000, 70000, 80000, 50000, 30000],
              backgroundColor: '#A96B22'
          },
          {
              label: 'Adopción',
              data: [100000, 110000, 130000, 115000, 30000, 50000, 20000, 30000, 80000, 60000, 90000, 120000],
              backgroundColor: '#3D6E9E'
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
              '#146B62', '#A96B22', '#AE3345',
              '#675289', '#3D6E9E', '#805A13'
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
      { name: 'Consultas generales', visits: 425, percent: 80, color: '#146B62' },
      { name: 'Adopción', visits: 425, percent: 75, color: '#3D6E9E' },
      { name: 'Salón de cuidados', visits: 425, percent: 85, color: '#A96B22' }
  ];
  serviceTrendData = {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [
          {
              label: 'Cirugías',
              data: [140000, 100000, 140000, 110000, 145000, 130000],
              fill: false,
              borderColor: '#3D6E9E',
              pointBackgroundColor: '#3D6E9E',
              tension: 0.35
          },
          {
              label: 'Consultas',
              data: [45000, 52000, 48000, 60000, 55000, 59000],
              fill: false,
              borderColor: '#146B62',
              pointBackgroundColor: '#146B62',
              tension: 0.35
          },
          {
              label: 'Estética',
              data: [35000, 38000, 36000, 42000, 40000, 45000],
              fill: false,
              borderColor: '#675289',
              pointBackgroundColor: '#675289',
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

  // ---------- LINE CHART (Clientes últimos 6 meses) ----------
  this.lineChartData.labels = data.clientes_mascotas.nuevos_clientes_6_meses.map(c => c.mes);
  this.lineChartData.datasets[0].data = data.clientes_mascotas.nuevos_clientes_6_meses.map(c => c.total);


  // ---------- PIE MASCOTAS ----------
  this.pieChartData.labels = data.clientes_mascotas.mascotas_por_especie.map(m => m.especie);
  this.pieChartData.datasets[0].data = data.clientes_mascotas.mascotas_por_especie.map(m => m.total);


  // ---------- BAR FINANZAS (muchos servicios / muchos meses) ----------
  const meses = [...new Set(data.finanzas.ingreso_mensual_por_servicio.map(i => i.mes))];
  this.barFinanceData.labels = meses;

  const servicios = [...new Set(data.finanzas.ingreso_mensual_por_servicio.map(i => i.servicio))];

  this.barFinanceData.datasets = servicios.map((serv, index) => ({
    backgroundColor: ['#146B62', '#A96B22', '#675289', '#3D6E9E'][index % 4],
    label: serv,
    data: meses.map(m => {
      const encontrado = data.finanzas.ingreso_mensual_por_servicio
        .find(i => i.servicio === serv && i.mes === m);
      return encontrado?.total ?? 0;
    })
  }));


  // ---------- PIE EGRESOS ----------
  this.pieExpensesData.labels = data.finanzas.distribucion_egresos.map(e => e.motivo);
  this.pieExpensesData.datasets[0].data = data.finanzas.distribucion_egresos.map(e => Number(e.total ?? 0));


  // ---------- TOP SERVICIOS ----------
  const totalVisitas = data.servicios.mas_solicitados.reduce((s, i) => s + i.visitas, 0);
  const colors = ['#146B62', '#3D6E9E', '#A96B22', '#675289'];

  this.topServices = data.servicios.mas_solicitados.map((s, i) => ({
    name: s.servicio,
    visits: s.visitas,
    percent: totalVisitas ? Math.round((s.visitas / totalVisitas) * 100) : 0,
    color: colors[i % colors.length]
  }));


  // ---------- RENTABILIDAD ----------
  this.profitability = data.finanzas.rentabilidad_servicios.map(r => ({
    name: r.servicio,
    percent: r.porcentaje,
    ingresos: `$${r.ingresos}`,
    costos: `$${r.costos}`
  }));


  // ---------- TENDENCIA 6 MESES ----------
  this.serviceTrendData.labels = data.servicios.tendencia_6_meses.map(t => t.mes);

  this.serviceTrendData.datasets = [
    {
      label: 'Ingresos últimos 6 meses',
      data: data.servicios.tendencia_6_meses.map(t => t.total),
      fill: false,
      borderColor: '#146B62',
      pointBackgroundColor: '#146B62',
      tension: 0.35
    }
  ];
}



  activeSelected(selected:string){
    this.selectedChart = selected;
  }

}