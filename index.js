import express from 'express';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {Server} from 'socket.io';

import sqlite, { DatabaseSync } from 'node:sqlite';

//retrieve title, image link, and description

const app = express();
const server = createServer(app);
const io = new Server(server);

const _dirname = dirname(fileURLToPath(import.meta.url));
const html_file_str = "\/index.html";
app.use('/images', express.static('images'));

app.get('/', (req, res) => {
    //console.log(req.headers);
    res.sendFile(join(_dirname, html_file_str));
    //console.log(req.ip);
});


const dataBase = new DatabaseSync('./images/imglinks.db');
//dataBase.exec("INSERT into data (link) VALUES ('www.google.com'), ('www.okfamous.com');");
const size_query = dataBase.prepare('SELECT COUNT(*) AS count FROM data');
const data_base = {
    size: size_query.get().count, 
    max_size: 100,
    db: dataBase,
    q_size: function () {return size_query.get().count},
    q_insert: function (elem) {
        //try{
        //if(elem instanceof String){
        try{
            const query = this.db.prepare('INSERT INTO data (title, desc, src) VALUES (?, ?, ?);'); 
            query.run(elem.title, elem.desc, elem.src);
        }catch(e){
            //console.error(e);
        }
        /*}else{
            throw elem;
        }
        }catch(e){
            console.error(`Failed to insert ${elem} into database. Element is not a string`);
        }*/
    },
    q_get_rnd: function () {
        const query = this.db.prepare(`SELECT * FROM data ORDER BY RANDOM() LIMIT 1`);
        return query.get();
    },
    q_remove: function (title) {
        const query = this.db.prepare(`DELETE FROM data WHERE title = ?`); 
        query.run(title);
    },
    q_contains: function (title) {
        const query = this.db.prepare(`SELECT * FROM data WHERE title = ?`);
        const rows = query.all(title);
        return rows.length > 0;
    },
    q_get_all: function (){
        const query = this.db.prepare(`SELECT * FROM data`);
        return query.all();
    }
};


io.on('connection', (socket) => {
    if(data_base.size > 0){
        const cube = data_base.q_get_rnd();
        socket.emit('receive-cube', {title: cube.title, desc: cube.desc, src: cube.src});
    }
 
    socket.on('get-cube', (data) => {
        if(data_base.size > 0 /*&& data.toString() instanceof String*/){
            const retrieved_data = data_base.q_get_rnd();
            //console.log(retrieved_data);
            socket.emit('receive-cube', {title: retrieved_data.title, desc: retrieved_data.desc, src: retrieved_data.src});
        }
        //console.log(data_base.q_get_all());
    });

    socket.on('add-cube', (data, pass) => {
        try{
        if(data_base.size < data_base.max_size && pass == "cubes"/* && data.toString() instanceof String*/){
            const parsed_title = /[^\s]+/.exec(data.title.toString());
            const parsed_desc = /[\w\d ;.,]+/.exec(data.desc.toString());
            const parsed_src = /[^\s]+/.exec(data.src.toString());
            if(parsed_title !== null && parsed_desc !== null && parsed_src !== null && !data_base.q_contains(parsed_title[0])){
                const cube = {title: parsed_title[0], desc: parsed_desc[0], src: parsed_src[0]}
                data_base.q_insert(cube);
                data_base.size++;
                socket.emit('passcode', {valid: true, action: 'add'});

                const socket_header_x = socket.handshake.headers["x-forwarded-for"];
                let ip_string = "";
                if(ip_string != null){
                    ip_string = socket_header_x.split(',')[0];
                }
                console.log(`Cube added: ${cube.title} by ${ip_string}`);
            }
        }else{
            socket.emit('passcode', {valid: false, action: 'add'});
        }
        }catch(e){
            //console.error(e);
        }
        //console.log(data_base.q_get_all());
    });

    //REMOVE CUBE IS DISABLED FOR NOW
    socket.on('remove-cube', (data, pass) => {
        //if(data.toString() instanceof String){
            const parsed_title = /[^\s]+/.exec(data.title.toString());
            if(false && pass == "cubes"){
                if(parsed_title !== null && data_base.q_contains(parsed_title[0])){
                    data_base.q_remove(parsed_title[0]);
                    data_base.size--;
                    socket.emit('passcode', {valid: true, action: 'remove'});

                    console.log(`Cube removed: ${parsed_title[0]}`);
                }
            }else{
                socket.emit('passcode', {valid: false, action: 'remove'});
            }
        //}
        //console.log(data_base.q_get_all());
    });
})

server.listen(80, "74.208.99.11 8", () => {
    //console.log(`listening on port`);
});



/**
 * Was ist mein Problem?
 * Was ich will: Ein Website abspeichern, dass andere dazu konnektieren konnen.
 * Was will ich im Website zeigen? 1 famous cubes, 2 blog.
 * Lern manche css
 */