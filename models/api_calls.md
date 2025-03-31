# /get-latest-reading/{room_id}

**GET**
Asks for latest reading of a certain room    

```json
200:
{
    "modules" : 
        [
            {
                "module_id" : 0,
                "module_xyz" : [100, 50, 0],
                "sensors" : 
                    [
                        {
                            "sensor_id" : "2381",
                            "sensor_type" : "CO2",
                            "sensor_units" : "ppm",
                            "readings": [
                                {
                                    "value" : 600,
                                    "time": 1
                                },
                            //...
                            ]
                        },
                        //...
                    ]
            },
            //...
        ]
}

400:
{
    "error" : "no readings"
}

4xx:
{
    "error" : "invalid room number"
}
```

## /place-module
**GET**
When the admin of a classroom clicks a location on the map, they an input a module with different sensor types. The module and corresponding sensors are then added to the database

```json
{
    "room_id" : 1,
    "x" : 50,
    "y" : 100,
    "z" : 0,
    "sensors" : 
        [
            {
                "sensor_type" : "CO2",
                "sensor_unit" : "ppm"
            },
            {
                "sensor_type" : "temp",
                "sensor_unit" : "celsius"
            }
        ]
}

200:

{"success" : "true"}

400:

{"error" : "invalid location"}
```

## /login-administrator
**POST**
Takes admin password and logs them in

```json
{
    "room_id" : "1",
    "password" : "admin123"
}

200:
{
    "success" : "true"
}

400:
{
    "error" : "incorrect password"
}
```

## /set-administrator
**POST**
sets admin password the first time admin is clicked

```json
{
    "room_id" : "1",
    "password" : "admin123"
}

200:
{
    "success" : "true"
}

400:
{
    "error" : "admin password already set"
}
```

## /get-data-timerange/{time_start}/{time_end?}
**GET**
gets all data points from start time to current, or specified end time

```json
200:
{
    "time_points" : 
        [
            {
                "time" : "2929289502",
                "modules" : 
                    [
                        {
                            "module_id" : "0",
                            "module_xyz" : ["100", "50", "0"],
                            "readings" : 
                                [
                                    {
                                        "sensor_id" : "2381",
                                        "sensor_type" : "CO2",
                                        "sensor_units" : "ppm",
                                        "value" : "600"
                                    },
                                    //...
                                ]
                        },
                    ]
            },
            //...
        ]
}

400:
{
    "error" : "invalid start time"
}
```


## /get-lastn-datapoints/{n}
**GET**
gets most recent n datapoints from each sensor

```json
{
    "time_points" : 
        [
            {
                "time" : "2929289502",
                "modules" : 
                    [
                        {
                            "module_id" : "0",
                            "module_xyz" : ["100", "50", "0"],
                            "readings" : 
                                [
                                    {
                                        "sensor_id" : "2381",
                                        "sensor_type" : "CO2",
                                        "sensor_units" : "ppm",
                                        "value" : "600"
                                    },
                                    //...
                                ]
                        },
                        //...
                    ]
            },
            //...
        ]
}

400:
{
    "error" : "10 data points do not exist"
}
```