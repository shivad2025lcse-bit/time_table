package com.smarttimetable.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "custom_venues")
public class CustomVenue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "venue_type")
    private String venueType;

    @Column(name = "block")
    private String block;

    @Column(name = "capacity")
    private String capacity;

    public CustomVenue() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getVenueType() { return venueType; }
    public void setVenueType(String venueType) { this.venueType = venueType; }

    public String getBlock() { return block; }
    public void setBlock(String block) { this.block = block; }

    public String getCapacity() { return capacity; }
    public void setCapacity(String capacity) { this.capacity = capacity; }
}
