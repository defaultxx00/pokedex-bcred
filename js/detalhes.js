// Pega o número do Pokémon pela URL (?numero=)
const params = new URLSearchParams(window.location.search);
const numero = params.get("numero");

// Função principal para desenhar os detalhes do Pokémon
async function drawPokemon(id) {
  const pokemon = await getPokemon("pokemon/" + id);
  if (!pokemon) return;

  document.title = `Pokémon ${capitalizeFirstLetter(pokemon.name)}`;

  // Botões anterior e próximo
  document.getElementById("anterior").innerHTML = await getPokemonAnterior(pokemon.id);
  document.getElementById("proximo").innerHTML = await getPokemonProximo(pokemon.id);

  document.querySelector("h1").innerHTML = `${pokemon.id
    .toString()
    .padStart(3, "0")} - ${capitalizeFirstLetter(pokemon.name)}`;

  // Busca a descrição (em inglês ou português se disponível)
  const species = await getPokemon("pokemon-species/" + pokemon.id);
  if (species && species.flavor_text_entries) {
    let entry = species.flavor_text_entries.find(
      (item) => item.language.name === "en" || item.language.name === "pt"
    );
    if (entry) {
      document.getElementById("descricao").innerHTML = entry.flavor_text.replace(/\f/g, " ");
    }
  }

  // Carrossel com imagens (normal e shiny)
  document.getElementById("imgPoke").innerHTML = carousel(pokemon.sprites);

  // Altura e peso
  document.getElementById("altura").innerHTML = `${pokemon.height / 10} m`;
  document.getElementById("peso").innerHTML = `${pokemon.weight / 10} kg`;

  // Tipos (botões coloridos)
  let tiposDiv = document.getElementById("tipos");
  tiposDiv.innerHTML = "";
  pokemon.types.forEach((tipo) => {
    const name = getTipo(tipo.type.name);
    tiposDiv.innerHTML += `<button class="btn btn-lg btn-${name} text-white">${name}</button>`;
  });

  // Sons (cry)
  let sons = document.getElementById("sons");
  sons.innerHTML = `<span class="fw-bold mb-0 me-2">Sons:</span>`;
  if (pokemon.cries?.latest) {
    sons.innerHTML += `
      <i class="bi bi-play-circle fs-1 me-3" onclick="document.getElementById('latest').play()"></i>
      <audio controls id='latest' hidden>
        <source src="${pokemon.cries.latest}" type="audio/ogg">
      </audio>`;
  }
  if (pokemon.cries?.legacy) {
    sons.innerHTML += `
      <i class="bi bi-play-circle fs-1" onclick="document.getElementById('legacy').play()"></i>
      <audio controls id='legacy' hidden>
        <source src="${pokemon.cries.legacy}" type="audio/ogg">
      </audio>`;
  }

  // Gráfico com Chart.js
  const stats = pokemon.stats.map((s) => s.base_stat);
  document.querySelector("#chartReport").innerHTML = `<canvas id="myChart"></canvas>`;

  const ctx = document.getElementById("myChart");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["HP", "Ataque", "Defesa", "Ataque Esp.", "Defesa Esp.", "Velocidade"],
      datasets: [
        {
          backgroundColor: ["#FE0000", "#EE7F30", "#F7D02C", "#F85687", "#77C755", "#678FEE"],
          data: stats,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
        title: { display: true, text: "Status" },
      },
      scales: { y: { beginAtZero: true } },
    },
  });
}

// Funções para o botão "Anterior" e "Próximo"
async function getPokemonAnterior(numero) {
  if (numero <= 1) return `<span></span>`;
  const anterior = await getPokemon("pokemon/" + (numero - 1));
  return `
    <button class='btn btn-outline-danger btn-lg' onclick='drawPokemon(${anterior.id})'>
      ${anterior.id.toString().padStart(3, "0")}<br>
      ${capitalizeFirstLetter(anterior.name)}
    </button>`;
}

async function getPokemonProximo(numero) {
  const proximo = await getPokemon("pokemon/" + (parseInt(numero) + 1));
  if (!proximo) return `<span></span>`;
  return `
    <button class='btn btn-outline-danger btn-lg' onclick='drawPokemon(${proximo.id})'>
      ${proximo.id.toString().padStart(3, "0")}<br>
      ${capitalizeFirstLetter(proximo.name)}
    </button>`;
}

// Busca manual pelo campo de pesquisa
async function search() {
  if (loading) return;
  const searchValue = document.querySelector('input[type="search"]').value.trim();
  if (searchValue === "") {
    drawPokemon(numero);
  } else {
    const pokemon = await getPokemon("pokemon/" + searchValue.toLowerCase());
    if (pokemon) drawPokemon(pokemon.id);
  }
}

// Inicializa a página ao carregar
document.addEventListener("DOMContentLoaded", async () => {
  await drawPokemon(numero);

  document.querySelector("form").addEventListener("submit", function (e) {
    e.preventDefault();
    search();
  });
});
