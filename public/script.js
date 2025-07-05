fetch('/api/items')
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById('items');
        data.forEach(item => {
          container.innerHTML += `
            <div class="item">
              <h3>${item.type.toUpperCase()}: ${item.title}</h3>
              <p>${item.description}</p>
              <p><strong>Date:</strong> ${new Date(item.date).toDateString()}</p>
              <p><strong>Location:</strong> ${item.location}</p>
              <p><strong>Contact:</strong> ${item.contact}</p>
              ${item.image ? `<img src="${item.image}" width="150">` : ''}
              <hr>
            </div>
          `;
        });
      });

      
