export default function generateSearchQuery(searchString: string[])  {
    let query = "Select recs.id, recs.user_id, recs.title, recs.author, recs.type, recs.summary, recs.link, recs.submit_time from recs join users on recs.user_id = users.id join tags on recs.id = tags.rec_id where ";
    for (let num = 1; num <= searchString.length; num++) {
        if (num !== 1) {query += ' or '}
        query += `LOWER(title) like $${num} or LOWER(type) like $${num} or LOWER(author) like $${num} or LOWER(summary) like $${num} or LOWER(reason) like $${num} or LOWER(tag) like $${num} or LOWER(name) like $${num}`
    }
    query += "  group by recs.id limit 10;";
    return query
}