<script setup lang="ts">
import { useRouter } from "vue-router";
import {
  useTransactionsQuery,
  useDeleteTransactionMutation,
  useUpdateTransactionMutation,
  useAddBulkTransactionsMutation,
} from "@/queries/useTransactions";
import { useCategoriesQuery } from "@/queries/useCategories";
import { ref, computed } from "vue";

const router = useRouter();
const page = ref(1);
const pageSize = 50;
const {
  data: transactionsResponse,
  isLoading,
  error,
  refetch: refetchPaginatedTransactions,
} = useTransactionsQuery(page, pageSize);

const transactions = computed(() => transactionsResponse.value?.data ?? []);
const total = computed(() => transactionsResponse.value?.count ?? 0);
const totalPages = computed(() => Math.ceil(total.value / pageSize));
const { data: categories } = useCategoriesQuery();

const { mutateAsync: deleteTransaction, isPending: isDeleting } =
  useDeleteTransactionMutation();

const { mutateAsync: updateTransaction, isPending: isUpdating } =
  useUpdateTransactionMutation();

const deleteError = ref("");

// Pour l'édition inline
const editId = ref<string | null>(null);
const editLabel = ref("");
const editAmount = ref(0);
const editCategoryId = ref("");
const editDate = ref("");
const editError = ref("");

function startEdit(tx: any) {
  editId.value = tx.id;
  editLabel.value = tx.label;
  editAmount.value = tx.amount;
  editCategoryId.value = tx.category_id || "";
  editDate.value = tx.transaction_date || "";
  editError.value = "";
}

function cancelEdit() {
  editId.value = null;
  editLabel.value = "";
  editAmount.value = 0;
  editCategoryId.value = "";
  editDate.value = "";
  editError.value = "";
}

async function saveEdit(tx: any) {
  editError.value = "";
  try {
    await updateTransaction({
      id: tx.id,
      updates: {
        label: editLabel.value,
        amount: editAmount.value,
        category_id: editCategoryId.value || null,
        transaction_date: editDate.value,
      },
    });
    cancelEdit();
  } catch (e: any) {
    editError.value = e.message || "Erreur lors de la modification";
  }
}

function getCategoryLabel(categoryId: string | null) {
  const cat = categories?.value?.find((c) => c.id === categoryId);
  return cat ? cat.label : "-";
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("fr-FR");
};

async function handleDelete(txId: string) {
  deleteError.value = "";
  if (confirm("Supprimer cette transaction ?")) {
    try {
      await deleteTransaction(txId);
    } catch (e: any) {
      deleteError.value = e.message || "Erreur lors de la suppression";
    }
  }
}

function goToPage(p: number) {
  if (p >= 1 && p <= totalPages.value) {
    page.value = p;
  }
}

// Pour l'import CSV
const fileInputRef = ref<HTMLInputElement | null>(null);
const isImporting = ref(false);
const importMessage = ref("");
const importError = ref("");
const { mutateAsync: addBulkTransactions } = useAddBulkTransactionsMutation();

// Fonction pour parser la date JJ/MM/AAAA en YYYY-MM-DD
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    if (
      !isNaN(parseInt(day)) &&
      !isNaN(parseInt(month)) &&
      !isNaN(parseInt(year)) &&
      parseInt(month) >= 1 &&
      parseInt(month) <= 12 &&
      parseInt(day) >= 1 &&
      parseInt(day) <= 31 &&
      year.length === 4
    ) {
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }
  console.warn(`Format de date invalide ignoré: ${dateStr}`);
  return null;
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  isImporting.value = true;
  importMessage.value = "";
  importError.value = "";

  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) {
        importError.value = "Impossible de lire le fichier.";
        isImporting.value = false;
        return;
      }

      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
      if (lines.length < 2) {
        importError.value =
          "Le fichier CSV est vide ou ne contient pas d'en-têtes.";
        isImporting.value = false;
        return;
      }

      // Nettoyer les en-têtes en supprimant les guillemets
      const headers = lines[0]
        .split(";")
        .map((h) => h.trim().replace(/^"|"$/g, ""));
      const dateIndex = headers.indexOf("Date operation");
      const labelIndex = headers.indexOf("Libelle");
      const debitIndex = headers.indexOf("Debit");
      const creditIndex = headers.indexOf("Credit");

      if (
        dateIndex === -1 ||
        labelIndex === -1 ||
        debitIndex === -1 ||
        creditIndex === -1
      ) {
        importError.value =
          'En-têtes manquants. Assurez-vous que le fichier contient "Date operation", "Libelle", "Debit", "Credit".';
        console.error("Headers found:", headers); // Pour le débogage
        isImporting.value = false;
        return;
      }

      const transactionsToCreate = [];
      let invalidCount = 0;

      for (let i = 1; i < lines.length; i++) {
        // Nettoyer les valeurs en supprimant les guillemets
        const values = lines[i]
          .split(";")
          .map((v) => v.trim().replace(/^"|"$/g, ""));
        if (
          values.length <
          Math.max(dateIndex, labelIndex, debitIndex, creditIndex) + 1
        ) {
          console.warn(`Ligne ${i + 1} ignorée: nombre de colonnes incorrect.`);
          invalidCount++;
          continue;
        }

        const rawDate = values[dateIndex];
        const label = values[labelIndex];
        const debit = parseFloat(values[debitIndex].replace(",", ".") || "0");
        const credit = parseFloat(values[creditIndex].replace(",", ".") || "0");

        if (!label) {
          console.warn(`Ligne ${i + 1} ignorée: Libellé manquant.`);
          invalidCount++;
          continue;
        }

        const transaction_date = parseDate(rawDate);
        if (!transaction_date) {
          console.warn(`Ligne ${i + 1} ignorée: Date invalide (${rawDate}).`);
          invalidCount++;
          continue;
        }

        const amount = credit - debit;

        transactionsToCreate.push({
          label,
          amount,
          transaction_date,
          category_id: null,
        });
      }

      if (transactionsToCreate.length > 0) {
        try {
          // Import en masse avec un seul appel API - les doublons seront gérés par Supabase via upsert
          const addedTransactions = await addBulkTransactions(
            transactionsToCreate
          );
          importMessage.value = `${
            addedTransactions.length
          } transaction(s) ajoutée(s). ${
            transactionsToCreate.length - addedTransactions.length
          } transaction(s) déjà existante(s). ${invalidCount} ligne(s) invalide(s) ignorée(s).`;
          refetchPaginatedTransactions();
        } catch (e: any) {
          importError.value =
            e.message || "Erreur lors de la création des transactions.";
        }
      } else {
        importMessage.value = `Aucune nouvelle transaction à ajouter. ${invalidCount} ligne(s) invalide(s) ignorée(s).`;
      }

      isImporting.value = false;
      if (fileInputRef.value) {
        fileInputRef.value.value = "";
      }
    };

    reader.onerror = () => {
      importError.value = "Erreur lors de la lecture du fichier.";
      isImporting.value = false;
      if (fileInputRef.value) {
        fileInputRef.value.value = "";
      }
    };

    reader.readAsText(file, "UTF-8");
  } catch (e: any) {
    importError.value = e.message || "Une erreur est survenue.";
    isImporting.value = false;
    if (fileInputRef.value) {
      fileInputRef.value.value = "";
    }
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-white py-12 px-4 sm:px-6 lg:px-8"
  >
    <div
      class="max-w-7xl w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8"
    >
      <h1 class="text-3xl font-extrabold text-gray-900 mb-6 text-center">
        Transactions
      </h1>
      <div class="mb-6 flex justify-between items-center">
        <div class="flex items-center gap-2">
          <input
            type="file"
            ref="fileInputRef"
            @change="handleFileUpload"
            accept=".csv"
            class="hidden"
            id="csv-upload"
          />
          <label
            for="csv-upload"
            class="cursor-pointer bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 disabled:opacity-50"
            :class="{ 'opacity-50': isImporting }"
            :disabled="isImporting"
          >
            {{ isImporting ? "Import en cours..." : "Importer CSV" }}
          </label>
          <span v-if="isImporting" class="text-sm text-gray-600"
            >Traitement...</span
          >
        </div>

        <button
          @click="() => router.push('/transactions/new')"
          class="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700"
        >
          Créer une transaction
        </button>
      </div>
      <div
        v-if="importMessage"
        class="mb-4 p-3 bg-green-100 text-green-800 rounded text-center"
      >
        {{ importMessage }}
      </div>
      <div
        v-if="importError"
        class="mb-4 p-3 bg-red-100 text-red-800 rounded text-center"
      >
        {{ importError }}
      </div>
      <div v-if="error" class="text-red-600 mb-4 text-center">
        {{ error.message }}
      </div>
      <div v-if="deleteError" class="text-red-600 mb-4 text-center">
        {{ deleteError }}
      </div>
      <div
        v-if="totalPages > 1"
        class="mb-4 mt-6 flex justify-between items-center text-sm"
      >
        <a
          href="#"
          @click.prevent="() => goToPage(page - 1)"
          :class="[
            'text-indigo-600 hover:underline',
            { 'opacity-40 pointer-events-none': page === 1 },
          ]"
        >
          Précédent
        </a>
        <span>Page {{ page }} sur {{ totalPages }}</span>
        <a
          href="#"
          @click.prevent="() => goToPage(page + 1)"
          :class="[
            'text-indigo-600 hover:underline',
            { 'opacity-40 pointer-events-none': page === totalPages },
          ]"
        >
          Suivant
        </a>
      </div>
      <div v-else style="height: 24px"></div>
      <div v-if="isLoading" class="text-center">Chargement...</div>
      <div v-else>
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Libellé
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Montant (€)
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Catégorie
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="tx in transactions" :key="tx.id">
              <template v-if="editId === tx.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-model="editLabel"
                    class="border rounded px-2 py-1 w-full"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-model.number="editAmount"
                    type="number"
                    class="border rounded px-2 py-1 w-full"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-model="editDate"
                    type="date"
                    class="border rounded px-2 py-1 w-full"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <select
                    v-model="editCategoryId"
                    class="border rounded px-2 py-1 w-full"
                  >
                    <option value="">Aucune</option>
                    <option
                      v-for="cat in categories"
                      :key="cat.id"
                      :value="cat.id"
                    >
                      {{ cat.label }}
                    </option>
                  </select>
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-right flex gap-2 justify-end"
                >
                  <button
                    @click="() => saveEdit(tx)"
                    :disabled="isUpdating"
                    class="bg-green-600 text-white px-2 py-1 rounded shadow"
                  >
                    Valider
                  </button>
                  <button
                    @click="cancelEdit"
                    class="bg-gray-300 px-2 py-1 rounded"
                  >
                    Annuler
                  </button>
                </td>
              </template>
              <template v-else>
                <td class="px-6 py-4 whitespace-nowrap">{{ tx.label }}</td>
                <td
                  class="px-6 py-4 whitespace-nowrap"
                  :class="tx.amount < 0 ? 'text-red-600' : 'text-green-600'"
                >
                  {{ formatAmount(tx.amount) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ formatDate(tx.transaction_date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ getCategoryLabel(tx.category_id) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    @click="() => startEdit(tx)"
                    class="text-blue-600 hover:underline mr-2"
                  >
                    Modifier
                  </button>
                  <button
                    @click="() => handleDelete(tx.id)"
                    :disabled="isDeleting"
                    class="text-red-600 hover:underline disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
        <div v-if="editError" class="text-red-600 text-center mt-2">
          {{ editError }}
        </div>
      </div>
      <div
        v-if="totalPages > 1"
        class="mt-6 flex justify-between items-center text-sm"
      >
        <a
          href="#"
          @click.prevent="() => goToPage(page - 1)"
          :class="[
            'text-indigo-600 hover:underline',
            { 'opacity-40 pointer-events-none': page === 1 },
          ]"
        >
          Précédent
        </a>
        <span>Page {{ page }} sur {{ totalPages }}</span>
        <a
          href="#"
          @click.prevent="() => goToPage(page + 1)"
          :class="[
            'text-indigo-600 hover:underline',
            { 'opacity-40 pointer-events-none': page === totalPages },
          ]"
        >
          Suivant
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
input:disabled {
  background: #f3f3f3;
}

/* Style pour cacher l'input file par défaut mais le rendre accessible */
input[type="file"].hidden {
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  position: absolute;
  z-index: -1;
}

label[for="csv-upload"]:disabled {
  cursor: not-allowed;
}
</style>
