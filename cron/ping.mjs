// Servicio cron de Railway: llama al endpoint de recordatorios y termina.
// Configurar en Railway con Cron Schedule: */15 * * * *
const url = `${process.env.SITE_URL}/api/cron/recordatorios`;
const res = await fetch(url, {
  headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
});
console.log(new Date().toISOString(), res.status, await res.text());
process.exit(res.ok ? 0 : 1);
