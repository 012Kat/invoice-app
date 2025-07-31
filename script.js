const form = document.getElementById('invoice-form');
const tableBody = document.querySelector('#invoice-table tbody');

const filterClient = document.getElementById('filter-client');
const filterStatus = document.getElementById('filter-status');
const filterBtn = document.getElementById('filter-btn');
const clearFilterBtn = document.getElementById('clear-filter-btn');
const cancelEditBtn = document.getElementById('cancel-edit');

let editingId = null;

async function fetchInvoices(client = '', status = '') {
  let url = '/api/invoices';
  if (client || status) {
    const params = new URLSearchParams();
    if (client) params.append('client', client);
    if (status) params.append('status', status);
    url = `/api/invoices/search?${params.toString()}`;
  }

  const res = await fetch(url);
  const invoices = await res.json();

  tableBody.innerHTML = '';
  invoices.forEach(inv => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${inv.client}</td>
      <td>${inv.amount.toFixed(2)}</td>
      <td>${inv.due_date}</td>
      <td>${inv.status}</td>
      <td>
        <button onclick="startEdit(${inv.id})">Edit</button>
        <button onclick="deleteInvoice(${inv.id})">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

form.addEventListener('submit', async e => {
  e.preventDefault();

  const invoice = {
    client: form.client.value.trim(),
    amount: parseFloat(form.amount.value),
    due_date: form.due_date.value,
    status: form.status.value,
  };

  const method = editingId ? 'PUT' : 'POST';
  const url = editingId ? `/api/invoices/${editingId}` : '/api/invoices';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoice)
  });

  if (res.ok) {
    resetForm();
    fetchInvoices(filterClient.value, filterStatus.value);
  } else {
    alert('Failed to save invoice');
  }
});

window.startEdit = async function (id) {
  const res = await fetch('/api/invoices');
  const invoices = await res.json();
  const invoice = invoices.find(inv => inv.id === id);
  if (!invoice) return alert('Not found');

  editingId = id;
  form.invoice_id.value = id;
  form.client.value = invoice.client;
  form.amount.value = invoice.amount;
  form.due_date.value = invoice.due_date;
  form.status.value = invoice.status;

  form.querySelector('button[type="submit"]').textContent = 'Update Invoice';
  cancelEditBtn.style.display = 'inline-block';
};

cancelEditBtn.addEventListener('click', resetForm);

function resetForm() {
  editingId = null;
  form.reset();
  form.querySelector('button[type="submit"]').textContent = 'Add Invoice';
  cancelEditBtn.style.display = 'none';
}

window.deleteInvoice = async function (id) {
  if (confirm('Delete this invoice?')) {
    const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    if (res.ok) fetchInvoices(filterClient.value, filterStatus.value);
    else alert('Delete failed');
  }
};

filterBtn.addEventListener('click', () => {
  fetchInvoices(filterClient.value.trim(), filterStatus.value);
});

clearFilterBtn.addEventListener('click', () => {
  filterClient.value = '';
  filterStatus.value = '';
  fetchInvoices();
});

fetchInvoices();
