window.DNARoutesView = class DNARoutesView extends View {
    static APP_ID = "Calendar";
    
    static people = new Map();
    static cc7MinPrivateId = 0;

    meta() {
        return {
            title: "DNA Routes",
            description: "A simple example app.",
        };
    }

    static addPeople(profiles) {
        let nrAdded = 0;
        for (const person of profiles) {
            //What does the + do?
            let id = +person.Id;
            if (id < 0) {
                if (DNARoutesView.people.has(id)) {
                    id = window.cc7MinPrivateId - 1;
                }
                person.Id = id;
                person.Name = `Private${id}`;
                person.DataStatus = { Spouse: "", Gender: "" };
            }
            if (!DNARoutesView.people.has(id)) {
                if (id < 0) {
                    window.cc7MinPrivateId = Math.min(id, window.cc7MinPrivateId);
                }
                person.Parents = [person.Father, person.Mother];
                
                ++nrAdded;

                DNARoutesView.people.set(id, person);
            } else {
                console.log(`Already added ${id}`);
            }
        }
        console.log(`Added ${nrAdded}`);

        let work = new Set();
        let added_work = 0;
        for(const [k, p] of DNARoutesView.people) {
            console.log(`Checking ${p.Id} ${p.Parents}`);
            if((p.Parents[0] != 0 && !DNARoutesView.people.has(p.Parents[0])) || (p.Parents[1] != 0 && !DNARoutesView.people.has(p.Parents[1]))) {
                added_work++;
                work.add(p.Id);
                console.log(`Work: ${p.Name}`);
            }
        }
        console.log(`New work left to do: ${work.size} and added ${added_work}`);
    }

    async init(container_selector, person_id) {
        console.log(person_id);
        const personData = await WikiTreeAPI.getPerson(DNARoutesView.APP_ID, person_id, ["FirstName"]);
        console.log(personData);
        const name = personData["_data"]["FirstName"];
        document.querySelector(container_selector).innerText = `Hello, ${name}`;

        if ($('#view-options').length) {
            $('#view-options').remove();
        }

        const displayOptionsHTML = `
        <div id="view-options">
            <label for="display-mode">Other relative:</label>
            <input type="text">
            <input type="submit" id="our-go" value="GO">
        </div>
        `;

        $('main').append(displayOptionsHTML);

        // Handle view mode switching
        $('#our-go').on('click', function () {
            console.log("asdasdasd");
        });

        DNARoutesView.cancelLoadController = new AbortController();

        const starttime = performance.now();
        try {
            const result = await WikiTreeAPI.postToAPI(
                {
                    appId: DNARoutesView.APP_ID,
                    action: "getPeople",
                    keys: "Bäckstrand-4",
                    nuclear: 0,
                    minGeneration: 0,
                    ancestors: 10,
                    start: 0,
                    limit: 1001,
                    fields: "Id,Name,FirstName,LastNameAtBirth,BirthDateDecade,DeathDateDecade,Father,Mother",
                },
                DNARoutesView.cancelLoadController.signal
            );
            console.log(
                `Retrieved profiles at degrees ${
                    performance.now() - starttime
                }ms`);

                console.log(result[0].status);
                console.log(result[0].people);
                console.log(Object.values(result[0].people).length);
                DNARoutesView.addPeople(Object.values(result[0].people));
        } catch(error) {
            console.warn(`Error: ${error}`);
        }

    }
};
