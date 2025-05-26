import { pool } from '../../db/connect.js';

class CardsService {
  async getAll() {
    const [rows] = await pool.execute('SELECT * FROM cards');
    return rows;
  }

  async getById(id) {
    const [rows] = await pool.execute('SELECT * FROM cards WHERE id = ?', [id]);
    if (!rows.length) throw { status: 404, message: 'Card not found' };
    return rows[0];
  }

  async create(data) {
    const { name, image_url, attack, defense, cost, description } = data;
    const [result] = await pool.execute(
      'INSERT INTO cards (name, image_url, attack, defense, cost, description) VALUES (?, ?, ?, ?, ?, ?)',
      [name, image_url, attack, defense, cost, description || null]
    );
    return this.getById(result.insertId);
  }

  async update(id, data) {
    const fields = [];
    const values = [];
    for (let key of ['name','image_url','attack','defense','cost','description']) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (!fields.length) throw { status: 400, message: 'No fields to update' };
    values.push(id);
    await pool.execute(`UPDATE cards SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.getById(id);
  }

  async delete(id) {
    await pool.execute('DELETE FROM cards WHERE id = ?', [id]);
    return { message: 'Deleted' };
  }

  // craft: объединить две карточки в новую со средними статами +1
  async craft(ids) {
    if (ids.length < 2) throw { status: 400, message: 'Need at least two cards to craft' };
    const cards = await Promise.all(ids.map(id => this.getById(id)));
    const avg = (key) => Math.floor(cards.reduce((s,c)=>s+c[key],0)/cards.length) + 1;
    const name = 'Crafted: ' + cards.map(c=>c.name).join('+');
    const image_url = cards[0].image_url;
    const attack = avg('attack'), defense = avg('defense'), cost = avg('cost');
    const [result] = await pool.execute(
      'INSERT INTO cards (name,image_url,attack,defense,cost) VALUES (?,?,?,?,?)',
      [name, image_url, attack, defense, cost]
    );
    return this.getById(result.insertId);
  }

  // upgrade: увеличить атаку и защиту на 10%
  async upgrade(id) {
    const card = await this.getById(id);
    const attack = Math.ceil(card.attack * 1.1);
    const defense = Math.ceil(card.defense * 1.1);
    await pool.execute(
      'UPDATE cards SET attack = ?, defense = ? WHERE id = ?',
      [attack, defense, id]
    );
    return this.getById(id);
  }
}

export default new CardsService();
